import path from "node:path";
// node:sqlite is available in the runtime used for this local desktop build.
import { DatabaseSync } from "node:sqlite";
import { paperDisplayTitle } from "@/lib/paper-display";
import { selectCurrentSubmission } from "@/lib/submission-workflow";

type RawPriority = {
  id: number; priority_order: number; student_id: number; student_name: string;
  title: string; paper_status: string; target_venue: string | null;
};
type RawSubmission = {
  id: number; paper_id: number; venue_name: string; submission_round: number;
  manuscript_no: string | null; submitted_at: Date | number | string | null;
  decision_at: Date | number | string | null; decision: string | null;
  status: string; notes: string | null; under_review_at: Date | number | string | null;
};

function db() {
  return new DatabaseSync(path.join(process.cwd(), "prisma", "data", "dev.db"), { readOnly: true });
}
function rows<T>(sql: string): T[] { const d=db(); try { return d.prepare(sql).all() as T[]; } finally { d.close(); } }

function asDate(v: Date | number | string | null | undefined) {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(v);
  const n = Number(v);
  if (Number.isFinite(n) && n > 10_000_000_000) return new Date(n);
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
export function fmtDate(v: Date | number | string | null | undefined) {
  const d = asDate(v); if (!d) return "";
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
}
function todayInChina() {
  return new Intl.DateTimeFormat("en-CA", {timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
}
export function resolveDateRange(from?: string, to?: string) {
  const today=todayInChina(), fallbackFrom=`${today.slice(0,4)}-01-01`;
  const valid=(s?:string)=>!!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
  let a=valid(from)?from!:fallbackFrom, b=valid(to)?to!:today; if(a>b)[a,b]=[b,a]; return {from:a,to:b};
}
function dayStartMs(s:string){return Date.parse(`${s}T00:00:00Z`)}
function dayEndMs(s:string){return Date.parse(`${s}T23:59:59.999Z`)}

export async function getDashboardHome(from:string,to:string,teacherId:number){
  const tid = Number(teacherId);
  const priority=rows<RawPriority>(`SELECT p.id,p.priority_order,p.student_id,s.name AS student_name,p.title,p.status AS paper_status,p.target_venue FROM papers p JOIN students s ON s.id=p.student_id WHERE s.teacher_id=${tid} AND COALESCE(p.is_priority,0)=1 ORDER BY p.priority_order ASC,p.id ASC`);
  const ids=priority.map(p=>Number(p.id));
  const submissions=ids.length?rows<RawSubmission>(`SELECT id,paper_id,venue_name,submission_round,manuscript_no,submitted_at,decision_at,decision,status,notes,under_review_at FROM submissions WHERE paper_id IN (${ids.join(",")}) ORDER BY paper_id,COALESCE(submitted_at,0) ASC,id ASC`):[];
  const byPaper=new Map<number,RawSubmission[]>(); submissions.forEach(s=>{const a=byPaper.get(Number(s.paper_id))||[];a.push(s);byPaper.set(Number(s.paper_id),a)});

  const tracked=priority.map(p=>{
    const order=Number(p.priority_order), subs=byPaper.get(Number(p.id))||[];
    const normalized=subs.map((x)=>({...x,submittedAt:x.submitted_at,underReviewAt:x.under_review_at,decisionAt:x.decision_at}));
    const latest=selectCurrentSubmission(normalized,p.paper_status) as any;
    let status="Planned Submission", detail=p.target_venue?`下一投 ${p.target_venue}`:"待确定目标期刊", venue=p.target_venue||"—", tone="planned";
    if(latest?.venue_name) venue=latest.venue_name;
    if(latest?.status==="awaiting_reviewer_assignment"){
      status="Awaiting Reviewer Assignment";tone="waiting";detail="等待分配审稿人";
    }else if(latest?.status==="under_review"){
      status="Under Review";tone="review";const d=fmtDate(latest?.under_review_at);detail=d?`${d} 进入外审`:"外审中";
    }else if(latest?.status==="submitted"){
      status="Submitted";tone="submitted";const d=fmtDate(latest?.submitted_at);detail=d?`${d} 已投稿`:"已投稿";
    }else if(latest?.status==="with_editor"||latest?.status==="pending"){
      status="With Editor";tone="editor";detail="编辑部处理中";
    }else if(p.paper_status==="minor_revision"){
      status="Minor Revision";tone="waiting";detail="小修处理中";
    }else if(p.paper_status==="major_revision"){
      status="Major Revision";tone="waiting";detail="大修处理中";
    }else if(p.paper_status==="accepted"||p.paper_status==="published"){
      status=p.paper_status==="accepted"?"Accepted":"Published";tone="review";detail=p.paper_status==="accepted"?"已接收":"已发表";
    }
    if(order===4&&p.paper_status==="ready_to_submit")detail="ASC 已拒稿 · 下一投 Applied Intelligence";
    return {id:Number(p.id),order,student:p.student_name,title:paperDisplayTitle(p.title),fullTitle:p.title,venue,status,detail,tone,targetVenue:p.target_venue||null,paperStatus:p.paper_status};
  });

  const lo=dayStartMs(from),hi=dayEndMs(to);
  const allSubs=rows<any>(`SELECT sub.id,sub.submitted_at,sub.decision_at,sub.decision,sub.status,COALESCE(sub.under_review_at,0) AS under_review_at,p.paper_type,p.id AS paper_id FROM submissions sub JOIN papers p ON p.id=sub.paper_id JOIN students s ON s.id=p.student_id WHERE s.teacher_id=${tid}`);
  const inRange=(v:any)=>{const d=asDate(v);return !!d&&d.getTime()>=lo&&d.getTime()<=hi};
  const submitted=allSubs.filter(s=>inRange(s.submitted_at)).length;
  const underReview=allSubs.filter(s=>inRange(s.under_review_at)||(s.decision==="under_review"&&inRange(s.decision_at))).length;
  const acceptedRows=allSubs.filter(s=>s.decision==="accept"&&inRange(s.decision_at));
  const rejected=allSubs.filter(s=>s.decision==="reject"&&inRange(s.decision_at)).length;
  const acceptedJournal=acceptedRows.filter(s=>s.paper_type==="journal").length, acceptedConference=acceptedRows.filter(s=>s.paper_type==="conference").length;

  const actions:any[]=tracked.filter(x=>x.status==="Planned Submission").map(x=>({kind:"submit",paperId:x.id,targetVenue:x.targetVenue,student:x.student,title:x.title,text:`准备投稿 ${x.targetVenue||"目标期刊"}`,order:x.order}));
  const waiting=tracked.filter(x=>x.status!=="Planned Submission").map(x=>{ const subs=byPaper.get(Number(x.id))||[]; const normalized=subs.map((r)=>({...r,submittedAt:r.submitted_at,underReviewAt:r.under_review_at,decisionAt:r.decision_at})); const latest=selectCurrentSubmission(normalized,x.paperStatus) as any; return {paperId:x.id,submissionId:latest?.id??null,student:x.student,title:x.title,status:x.status,venue:x.venue,detail:x.detail,order:x.order}; });
  const revisionDue=rows<any>(`SELECT r.id,r.due_at,r.status AS revision_status,p.id AS paper_id,p.status AS paper_status,p.title,s.name AS student_name FROM revisions r JOIN submissions sub ON sub.id=r.submission_id JOIN papers p ON p.id=sub.paper_id JOIN students s ON s.id=p.student_id WHERE s.teacher_id=${tid} AND p.status IN ('minor_revision','major_revision') AND r.submitted_at IS NULL AND r.due_at IS NOT NULL ORDER BY r.due_at ASC`);
  revisionDue.forEach((r:any)=>actions.unshift({kind:"revision",paperId:Number(r.paper_id),revisionId:Number(r.id),student:r.student_name,title:paperDisplayTitle(r.title),text:`返修截止 ${fmtDate(r.due_at)}`,order:0}));

  const studentMap=new Map<string,{student:string;count:number;planned:number;submitted:number;we:number;ara:number;ur:number;accepted:number;recent:string;recentRank:number;recentOrder:number}>();
  tracked.forEach(x=>{
    const v=studentMap.get(x.student)||{student:x.student,count:0,planned:0,submitted:0,we:0,ara:0,ur:0,accepted:0,recent:"",recentRank:99,recentOrder:99};v.count++;
    if(x.status==="Planned Submission")v.planned++;
    else if(x.status==="Submitted")v.submitted++;
    else if(x.status==="With Editor")v.we++;
    else if(x.status==="Awaiting Reviewer Assignment")v.ara++;
    else if(x.status==="Under Review")v.ur++;
    const rank=x.status==="Under Review"?1:x.status==="Awaiting Reviewer Assignment"?2:x.status==="With Editor"?3:x.status==="Submitted"?4:5;
    if(rank<v.recentRank||(rank===v.recentRank&&x.order<v.recentOrder)){
      v.recentRank=rank;v.recentOrder=x.order;
      if(x.status==="Under Review") v.recent=`${x.title}进入外审`;
      else if(x.status==="Awaiting Reviewer Assignment") v.recent=`${x.title}等待分配审稿人`;
      else if(x.status==="With Editor") v.recent=`${x.title}编辑处理中`;
      else if(x.status==="Submitted") v.recent=`${x.title}已投稿`;
      else v.recent=`${x.title}准备投 ${x.targetVenue||x.venue}`;
    }
    studentMap.set(x.student,v);
  });
  const acceptedByStudent=rows<any>(`SELECT s.name AS student_name,COUNT(DISTINCT p.id) AS accepted_count FROM students s JOIN papers p ON p.student_id=s.id WHERE s.teacher_id=${tid} AND s.status='active' AND p.status IN ('accepted','published') GROUP BY s.id,s.name`);
  acceptedByStudent.forEach((r:any)=>{
    const name=String(r.student_name), accepted=Number(r.accepted_count)||0;
    const v=studentMap.get(name)||{student:name,count:0,planned:0,submitted:0,we:0,ara:0,ur:0,accepted:0,recent:"",recentRank:99,recentOrder:99};
    v.accepted=accepted;
    if(!v.recent && accepted>0) v.recent=`已有 ${accepted} 篇录用成果`;
    studentMap.set(name,v);
  });
  const students=Array.from(studentMap.values()).map(({recentRank: _recentRank,recentOrder: _recentOrder,...x})=>x);
  return {tracked,actions,waiting,students,stats:{submitted,underReview,accepted:acceptedRows.length,acceptedJournal,acceptedConference,rejected}};
}
