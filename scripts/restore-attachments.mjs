import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const explicitIdIndex = args.indexOf("--id");
const explicitFileIndex = args.indexOf("--file");
const explicitId = explicitIdIndex >= 0 ? Number(args[explicitIdIndex + 1]) : null;
const explicitFile = explicitFileIndex >= 0 ? args[explicitFileIndex + 1] : null;
const sourceDir = args.find((x, i) => !x.startsWith("--") && !(explicitIdIndex >= 0 && i === explicitIdIndex + 1) && !(explicitFileIndex >= 0 && i === explicitFileIndex + 1));

if (!sourceDir && !(explicitId && explicitFile)) {
  console.log("用法：");
  console.log("  npm run restore-attachments -- /旧附件目录");
  console.log("  npm run restore-attachments -- /旧附件目录 --apply");
  console.log("  npm run restore-attachments -- --id 11 --file /path/EAAI_外审意见0406.docx --apply");
  process.exit(1);
}

const root = process.cwd();
const dbPath = path.join(root, "prisma", "data", "dev.db");
const db = new DatabaseSync(dbPath);
const fileRootFromSetting = (teacherId) => {
  try {
    const row = db.prepare("SELECT config_json FROM teacher_settings WHERE teacher_id=?").get(teacherId);
    const cfg = JSON.parse(row?.config_json || "{}");
    return path.resolve(root, cfg.fileRootDir || "data/files");
  } catch { return path.resolve(root, "data/files"); }
};

function listFiles(dir) {
  const out = [];
  if (!dir || !fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

function restore(row, candidate) {
  const stat = fs.statSync(candidate);
  if (row.file_size > 0 && Number(row.file_size) !== stat.size) {
    return { ok: false, reason: `大小不符：记录 ${row.file_size}，候选 ${stat.size}` };
  }
  const target = path.join(fileRootFromSetting(row.teacher_id), row.file_path);
  if (!apply) return { ok: true, dryRun: true, target, size: stat.size };
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(candidate, target);
  db.prepare("UPDATE attachments SET file_size=? WHERE id=?").run(stat.size, row.id);
  return { ok: true, target, size: stat.size };
}

try {
  if (explicitId && explicitFile) {
    const row = db.prepare("SELECT * FROM attachments WHERE id=?").get(explicitId);
    if (!row) throw new Error(`附件 ID ${explicitId} 不存在`);
    const result = restore(row, path.resolve(explicitFile));
    console.log(result.ok ? `${apply ? "RESTORED" : "MATCH"} #${row.id} ${row.file_name} -> ${result.target}` : `SKIP #${row.id} ${result.reason}`);
    process.exit(result.ok ? 0 : 2);
  }

  const files = listFiles(path.resolve(sourceDir));
  const byName = new Map();
  for (const f of files) {
    const name = path.basename(f);
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name).push(f);
  }

  const rows = db.prepare("SELECT * FROM attachments ORDER BY id").all();
  let matched = 0, ambiguous = 0, missing = 0;
  for (const row of rows) {
    const candidates = byName.get(row.file_name) || [];
    const sizeMatches = row.file_size > 0
      ? candidates.filter((f) => fs.statSync(f).size === Number(row.file_size))
      : candidates;
    if (sizeMatches.length === 1) {
      const result = restore(row, sizeMatches[0]);
      console.log(`${apply ? "RESTORED" : "MATCH"} #${row.id} ${row.file_name} <- ${sizeMatches[0]}`);
      if (result.ok) matched++;
    } else if (sizeMatches.length > 1) {
      console.log(`AMBIGUOUS #${row.id} ${row.file_name} (${sizeMatches.length} 个候选)，不自动写入`);
      ambiguous++;
    } else {
      console.log(`MISSING #${row.id} ${row.file_name}`);
      missing++;
    }
  }
  console.log(`\n${apply ? "回填" : "dry-run"}完成：matched=${matched}, ambiguous=${ambiguous}, missing=${missing}`);
  if (!apply) console.log("确认匹配无误后追加 --apply；同名歧义请使用 --id + --file 明确指定。");
} finally {
  db.close();
}
