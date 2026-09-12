import "./home-dashboard.css";
import Link from "next/link";
import { getDashboardHome, resolveDateRange } from "@/lib/dashboard-home";
import { requireTeacher } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TONE: Record<string,string> = {
  review:"home-status home-status-review", editor:"home-status home-status-editor",
  waiting:"home-status home-status-waiting", submitted:"home-status home-status-editor", planned:"home-status home-status-planned",
};

export default async function DashboardPage({ searchParams }: { searchParams?: { from?: string; to?: string } }) {
  const teacher = await requireTeacher();
  const { from, to } = resolveDateRange(searchParams?.from, searchParams?.to);
  const D = await getDashboardHome(from, to, teacher.id);
  return (
    <div className="home-shell">
      <header className="home-head">
        <div><h1>论文投稿工作台</h1><p>把重点论文、近期动作和学生推进放在一处看。</p></div>
        <form className="home-range" method="get">
          <span>统计范围</span><input type="date" name="from" defaultValue={from}/><b>—</b><input type="date" name="to" defaultValue={to}/><button>应用</button>
        </form>
      </header>

      <section className="home-stat-grid">
        <div className="home-stat"><span>投稿次数</span><strong>{D.stats.submitted}</strong><small>{from} 至 {to}</small></div>
        <div className="home-stat"><span>进入外审</span><strong>{D.stats.underReview}</strong><small>本期进入外审</small></div>
        <div className="home-stat"><span>录用</span><strong>{D.stats.accepted}</strong><small>期刊 {D.stats.acceptedJournal} · 会议 {D.stats.acceptedConference}</small></div>
        <div className="home-stat"><span>拒稿 / 改投</span><strong>{D.stats.rejected}</strong><small>本期拒稿或改投</small></div>
      </section>

      <section className="home-panel home-priority">
        <div className="home-section-head"><div><h2>重点跟踪</h2><p>这几篇值得多看一眼</p></div><span>{D.tracked.length} 篇</span></div>
        <div className="home-priority-head"><span>#</span><span>负责人 / 稿件</span><span>当前期刊</span><span>当前状态</span><span>节点</span></div>
        {D.tracked.map(x => (
          <Link href={`/papers/${x.id}`} className="home-priority-row" key={x.id}>
            <b className="home-order">{x.order}</b>
            <div className="home-paper"><strong>{x.student}</strong><span title={x.fullTitle}>{x.title}</span></div>
            <div className="home-venue">{x.venue}</div>
            <div><span className={TONE[x.tone]}>{x.status}</span></div>
            <div className="home-detail">{x.detail}</div>
          </Link>
        ))}
      </section>

      <section className="home-lower-grid">
        <div className="home-panel">
          <div className="home-section-head"><div><h2>待处理事项</h2><p>今天先看这些</p></div><span>{D.actions.length} 项</span></div>
          <div className="home-subtitle">需要推进</div>
          {D.actions.length ? D.actions.map((a:any,i:number)=>{ const href=a.kind==="submit"?`/submissions?new=1&paperId=${a.paperId}&venue=${encodeURIComponent(a.targetVenue||"")}`:`/papers/${a.paperId}`; return <Link href={href} className="home-action" key={`${a.order}-${i}`}><b>{a.student}</b><span>{a.title}</span><em>{a.text}</em></Link>; }) : <div className="home-empty">当前没有需要主动处理的节点</div>}
          <div className="home-subtitle home-subtitle-gap">等待外部处理</div>
          {D.waiting.map(w => <Link href={w.submissionId?`/submissions?edit=${w.submissionId}`:`/papers/${w.paperId}`} className="home-wait" key={w.order}><div><b>{w.student} · {w.title}</b><span>{w.venue} · {w.detail}</span></div><em>{w.status}</em></Link>)}
        </div>

        <div className="home-panel">
          <div className="home-section-head"><div><h2>学生概览</h2><p>看看每个人手上的稿件走到哪一步了</p></div><span>{D.students.length} 人</span></div>
          <div className="home-student-legend">
            <span><i className="dot dot-accepted"/>Accepted</span>
            <span><i className="dot dot-planned"/>待投</span>
            <span><i className="dot dot-submitted"/>Submitted</span>
            <span><i className="dot dot-we"/>WE</span>
            <span><i className="dot dot-ara"/>待分配</span>
            <span><i className="dot dot-ur"/>UR</span>
          </div>
          <div className="home-student-head">
            <span>学生</span><span>在跟踪</span><span>Accepted</span><span>待投</span><span>Submitted</span><span>WE</span><span>待分配</span><span>UR</span><span>最近进展</span>
          </div>
          {D.students.map(s => <div className="home-student-row" key={s.student}>
            <b>{s.student}</b><strong>{s.count}</strong>
            <span className="stage-count"><i className="dot dot-accepted"/>{s.accepted}</span>
            <span className="stage-count"><i className="dot dot-planned"/>{s.planned}</span>
            <span className="stage-count"><i className="dot dot-submitted"/>{s.submitted}</span>
            <span className="stage-count"><i className="dot dot-we"/>{s.we}</span>
            <span className="stage-count"><i className="dot dot-ara"/>{s.ara}</span>
            <span className="stage-count"><i className="dot dot-ur"/>{s.ur}</span>
            <span className="student-recent" title={s.recent}>{s.recent}</span>
          </div>)}
        </div>
      </section>
    </div>
  );
}
