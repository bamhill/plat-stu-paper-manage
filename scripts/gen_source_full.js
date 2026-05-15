const {Document,Packer,Paragraph,TextRun,AlignmentType}=require('docx');
const fs=require('fs'),path=require('path');
const A='研究生论文过程管理系统V1.0';
const root='d:/00_project/2026_StuManage/src';
const prj='d:/00_project/2026_StuManage';
const T=(size,opts={})=>new TextRun({size,font:'Consolas',...opts});

function cleanCode(code){
  code=code.replace(/\/\*[\s\S]*?\*\//g,'');
  const lines=code.split('\n');
  const result=[];
  let blank=0;
  for(let line of lines){
    const s=line.trim();
    if(/^\s*\/\/\s*(Auto-|CRITICAL|IMPORTANT|Root cause|Use\s+useEffect|Store path|Determine|Load existing|Ensure|Collect|Simple|Replace|Change|The\s|Key\s|Same|Built|Shorten|Clean|If\s|Make\s|Update|Create|Check|Set|This\s|Handle|Note:|TODO|FIXME|HACK|XXX)/i.test(s) ||
       /^\s*\/\/\s*(eslint-disable|ts-nocheck)/i.test(s)){
      const idx=line.indexOf('//');
      if(idx>0){line=line.substring(0,idx).trimEnd()}
      else if(idx===0){continue}
    }
    if(line.trim()===''){blank++;if(blank>1)continue}
    else{blank=0}
    result.push(line);
  }
  return result.join('\n');
}

function walk(dir,exts,prefix=''){
  const out=[];
  const full=prefix?path.join(prj,prefix):dir;
  if(!fs.existsSync(full))return out;
  const e=fs.readdirSync(full,{withFileTypes:true});
  for(const d of e){
    if(d.name.startsWith('.')||d.name==='node_modules'||d.name==='generated'||d.name==='fonts')continue;
    const rp=prefix?prefix+'/'+d.name:d.name;
    const fp=path.join(prj,rp);
    if(d.isDirectory())out.push(...walk(fp,exts,rp));
    else if(exts.some(x=>d.name.endsWith(x)))out.push(rp);
  }
  return out;
}

// Collect files
const srcFiles=walk(root,['.ts','.tsx'],'src');
const cfgFiles=['tailwind.config.ts','next.config.mjs','package.json','tsconfig.json','components.json','.eslintrc.json']
  .filter(f=>fs.existsSync(path.join(prj,f)));
const allFiles=['prisma/schema.prisma',...srcFiles,...cfgFiles];

// Sort: schema, lib, actions, components, pages, api, config
function rank(fp){
  if(fp.startsWith('prisma/'))return 1;
  if(fp.includes('/lib/'))return 2;
  if(fp.includes('/actions.ts'))return 3;
  if(fp.includes('/components/'))return 4;
  if(fp.includes('/page.tsx'))return 5;
  if(fp.includes('/api/'))return 6;
  return 9;
}
allFiles.sort((a,b)=>rank(a)-rank(b)||a.localeCompare(b));

async function main(){
  const pages=[];
  pages.push(new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:400},children:[T(24,{text:'// '+A+' 源程序',bold:true,font:'SimSun'})]}));
  pages.push(new Paragraph({spacing:{after:200}}));

  let count=0,totalLines=0;
  for(const fp of allFiles){
    const full=path.join(prj,fp);
    if(!fs.existsSync(full))continue;
    let code=fs.readFileSync(full,'utf8');
    code=cleanCode(code);
    const lines=code.split('\n').filter(l=>l.trim());
    if(lines.length<3)continue;

    pages.push(new Paragraph({spacing:{before:160,after:40},children:[T(18,{text:'文件名：'+fp,bold:true,font:'SimSun'})]}));
    pages.push(new Paragraph({spacing:{line:240},children:[T(14,{text:code})]}));
    count++;totalLines+=lines.length;
  }

  const sec={properties:{page:{size:{width:11906,height:16838},margin:{top:1000,bottom:1000,left:1200,right:1200}}},children:pages};
  const doc=new Document({sections:[sec]});
  const buf=await Packer.toBuffer(doc);
  fs.writeFileSync(prj+'/研究生论文过程管理系统V1.0_源代码.docx',buf);
  const pg=Math.ceil(totalLines/45);
  console.log('Files: '+count+', Lines: '+totalLines+', Pages: ~'+pg);
}
main().catch(e=>{console.error(e);process.exit(1)});
