const {Document,Packer,Paragraph,TextRun,AlignmentType}=require('docx');
const fs=require('fs'),path=require('path');
const A='研究生论文过程管理系统V1.0';
const root='d:/00_project/2026_StuManage';
const T=(s,o={})=>new TextRun({size:s,font:'Consolas',...o});

// Clean: remove ONLY JSDoc blocks and AI-explanatory single-line comments.
// Keep practical inline Chinese comments (setting explanations).
function cleanCode(code){
  // Remove JSDoc blocks /* ... */
  code=code.replace(/\/\*[\s\S]*?\*\//g,'');
  const lines=code.split('\n');
  const result=[];
  let blank=0;
  for(let line of lines){
    const s=line.trim();
    // Only remove obvious AI-style explanatory English comments.
    if(/^\s*\/\/\s*(Auto-|CRITICAL|IMPORTANT|Root cause|Use\s+useEffect|Store path|Determine|Load existing|Ensure|Collect|Simple|Replace|Change|The\s|Key\s|Same|Built|Shorten|Clean|Make\s|Update|Create|Check|Set|This\s|Handle|Note:)/i.test(s) ||
       /^\s*\/\/\s*(eslint-disable|ts-nocheck)/i.test(s)){
      const idx=line.indexOf('//');
      if(idx>0){line=line.substring(0,idx).trimEnd()}
      else if(idx===0){continue}
    }
    // Remove @author @param @returns lines
    if(/^\s*\*\s*@(author|param|returns|file|package|license|link|category)/i.test(s)){
      continue;
    }
    if(line.trim()===''){blank++;if(blank>1)continue}
    else{blank=0}
    result.push(line);
  }
  return result.join('\n');
}

// Priority files order - the most important ones first
const CORE_FILES=[
  'prisma/schema.prisma',
  'src/lib/prisma.ts',
  'src/lib/settings.ts',
  'src/lib/validators.ts',
  'src/lib/timeline.ts',
  'src/lib/file-utils.ts',
  'src/lib/paper-status.ts',
  'src/lib/utils.ts',
  'src/app/students/actions.ts',
  'src/app/papers/actions.ts',
  'src/app/submissions/actions.ts',
  'src/app/revisions/actions.ts',
  'src/app/theses/actions.ts',
  'src/components/students/student-form.tsx',
  'src/components/students/student-table.tsx',
  'src/components/papers/paper-form.tsx',
  'src/components/papers/paper-table.tsx',
  'src/components/papers/paper-versions.tsx',
  'src/components/submissions/submission-form.tsx',
  'src/components/submissions/submission-table.tsx',
  'src/components/revisions/revision-form.tsx',
  'src/components/revisions/revision-table.tsx',
  'src/components/theses/thesis-form.tsx',
  'src/components/theses/thesis-review-form.tsx',
  'src/components/theses/thesis-table.tsx',
  'src/components/shared/status-badge.tsx',
  'src/components/shared/attachment-upload.tsx',
  'src/components/shared/confirm-delete.tsx',
  'src/components/ui/select.tsx',
  'src/components/layout/app-sidebar.tsx',
  'src/components/layout/app-breadcrumb.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/students/page.tsx',
  'src/app/students/[id]/page.tsx',
  'src/app/papers/page.tsx',
  'src/app/papers/[id]/page.tsx',
  'src/app/papers/[id]/submission-timeline.tsx',
  'src/app/submissions/page.tsx',
  'src/app/revisions/page.tsx',
  'src/app/theses/page.tsx',
  'src/app/theses/[id]/page.tsx',
  'src/app/theses/[id]/thesis-detail-client.tsx',
  'src/app/query/page.tsx',
  'src/app/query/query-client.tsx',
  'src/app/analysis/page.tsx',
  'src/app/analysis/analysis-client.tsx',
  'src/app/import/page.tsx',
  'src/app/settings/page.tsx',
  'src/app/api/files/upload/route.ts',
  'src/app/api/attachments/route.ts',
  'src/components/dashboard/student-card.tsx',
  'src/components/dashboard/grade-group.tsx',
  'src/components/ui/form.tsx',
  'src/components/ui/dialog.tsx',
  'src/components/ui/alert-dialog.tsx',
  'src/components/ui/table.tsx',
  'src/components/ui/badge.tsx',
  'src/components/ui/button.tsx',
  'src/components/ui/card.tsx',
  'src/components/ui/input.tsx',
  'src/components/ui/textarea.tsx',
  'src/components/ui/tabs.tsx',
  'src/components/ui/sidebar.tsx',
  'src/components/ui/breadcrumb.tsx',
  'src/components/ui/dropdown-menu.tsx',
  'src/components/ui/sonner.tsx',
  'src/components/ui/label.tsx',
  'src/hooks/use-mobile.ts',
  'src/app/students/student-list-tabs.tsx',
  'src/app/students/[id]/student-detail-tabs.tsx',
  'src/app/papers/paper-list-client.tsx',
  'src/app/submissions/submission-list-client.tsx',
  'src/app/revisions/revision-list-client.tsx',
  'src/app/theses/thesis-list-client.tsx',
  'src/app/theses/[id]/thesis-detail-client.tsx',
  'src/app/import/import-client.tsx',
  'src/app/settings/settings-client.tsx',
  'src/app/api/settings/route.ts',
  'src/app/api/files/[...path]/route.ts',
  'src/app/api/import/route.ts',
  'src/app/api/import/template/route.ts',
  'src/app/api/papers/list/route.ts',
  'src/app/api/students/list/route.ts',
  'src/app/api/submissions/list/route.ts',
];

async function main(){
  const pages=[];
  // Title line exactly matching template: //软件名（V1.0）源程序开始
  pages.push(new Paragraph({spacing:{after:100},children:[T(20,{text:'//'+A+'源程序开始',bold:true})]}));
  pages.push(new Paragraph({spacing:{after:60}}));

  let totalLines=0;
  const TARGET_LINES=4600; // 60 pages at ~76 lines/page (8pt Consolas A4, verified)

  for(const fp of CORE_FILES){
    if(totalLines>=TARGET_LINES)break;
    const full=path.join(root,fp);
    if(!fs.existsSync(full))continue;

    let code=fs.readFileSync(full,'utf8');
    code=cleanCode(code);
    const codeLines=code.split('\n');
    if(codeLines.length<15)continue;

    // File header matching template style
    pages.push(new Paragraph({spacing:{before:60,after:30},children:[T(18,{text:'文件名：'+fp,bold:true})]}));

    // Code lines
    for(const line of codeLines){
      pages.push(new Paragraph({spacing:{line:260},children:[T(14,{text:line||' '})]}));
    }
    totalLines+=codeLines.length;
  }

  const sec={properties:{page:{size:{width:11906,height:16838},margin:{top:1000,bottom:1000,left:1400,right:1000}}},children:pages};
  const buf=await Packer.toBuffer(new Document({sections:[sec]}));
  fs.writeFileSync(root+'/研究生论文过程管理系统V1.0_源代码.docx',buf);
  console.log('Files: ~'+Math.min(CORE_FILES.length,Math.ceil(totalLines/55)));
  console.log('Lines: '+totalLines);
  console.log('Pages: ~'+Math.ceil(totalLines/56));
}
main().catch(e=>{console.error(e);process.exit(1)});
