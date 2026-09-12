import fs from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = process.cwd();
const dbPath = path.resolve(root, process.env.DATABASE_FILE || "prisma/data/dev.db");
if (!fs.existsSync(dbPath)) {
  throw new Error(`Database not found: ${dbPath}`);
}

const db = new DatabaseSync(dbPath);
const hasTable = (name) => Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name));
const columns = (name) => hasTable(name) ? db.prepare(`PRAGMA table_info(${name})`).all().map((x) => x.name) : [];

function ensureLegacyClaimCode() {
  const pending = hasTable("teachers") && Boolean(db.prepare("SELECT 1 FROM teachers WHERE status='pending_claim' LIMIT 1").get());
  if (!pending) return null;
  const fromEnv = (process.env.LEGACY_CLAIM_CODE || "").trim();
  if (fromEnv) return { code: fromEnv, source: "LEGACY_CLAIM_CODE" };
  const dataDir = path.join(root, "data");
  const claimFile = path.join(dataDir, "legacy-claim-code");
  fs.mkdirSync(dataDir, { recursive: true });
  try {
    const existing = fs.readFileSync(claimFile, "utf8").trim();
    if (existing) return { code: existing, source: claimFile };
  } catch {}
  const code = randomBytes(18).toString("base64url");
  fs.writeFileSync(claimFile, code, { encoding: "utf8", mode: 0o600 });
  return { code, source: claimFile };
}

function loadLegacyConfig() {
  const p = path.join(root, "data", "config.json");
  try { return JSON.stringify(JSON.parse(fs.readFileSync(p, "utf8"))); }
  catch { return JSON.stringify({
    fileRootDir: "data/files", organizeByStudent: true,
    degreeTypes: ["工学硕士","工业工程专硕","MBA全日制","MEM非全","MBA非全"],
    aiPackageDefaults: {
      includeEditorDecision: true, includeReviewerComments: true, includeRevisionHistory: true,
      includeSubmissionHistory: true, includeResponsibilityHistory: true, includeAttachments: true
    }
  }); }
}

try {
  db.exec("PRAGMA foreign_keys=OFF");
  db.exec(`
    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS teacher_settings (
      id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL UNIQUE,
      config_json TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  const studentCount = hasTable("students") ? Number(db.prepare("SELECT COUNT(*) AS n FROM students").get().n) : 0;
  let owner = db.prepare("SELECT id FROM teachers WHERE status='pending_claim' ORDER BY id LIMIT 1").get();
  const activeCount = Number(db.prepare("SELECT COUNT(*) AS n FROM teachers WHERE status='active'").get().n);
  if (studentCount > 0 && !owner && activeCount === 0) {
    db.prepare("INSERT INTO teachers(name,email,password_hash,status,updated_at) VALUES(?,?,?,?,CURRENT_TIMESTAMP)")
      .run("待认领数据", "legacy-owner@local.invalid", "disabled", "pending_claim");
    owner = db.prepare("SELECT id FROM teachers WHERE status='pending_claim' ORDER BY id LIMIT 1").get();
  }
  const ownerId = owner?.id ?? db.prepare("SELECT id FROM teachers WHERE status='active' ORDER BY id LIMIT 1").get()?.id ?? null;

  if (hasTable("students") && !columns("students").includes("teacher_id")) {
    if (!ownerId) throw new Error("Legacy student data exists but no owner could be created");
    db.exec(`
      CREATE TABLE students_r16 (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        teacher_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        student_no TEXT NOT NULL,
        degree_type TEXT NOT NULL,
        enrollment_year INTEGER NOT NULL,
        graduation_year INTEGER,
        direction TEXT NOT NULL,
        supervisor TEXT NOT NULL,
        co_supervisor TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        show_on_dashboard BOOLEAN NOT NULL DEFAULT true,
        notes TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE (teacher_id, student_no)
      );
    `);
    db.prepare(`INSERT INTO students_r16(id,teacher_id,name,student_no,degree_type,enrollment_year,graduation_year,direction,supervisor,co_supervisor,status,show_on_dashboard,notes,created_at,updated_at)
      SELECT id,?,name,student_no,degree_type,enrollment_year,graduation_year,direction,supervisor,co_supervisor,status,show_on_dashboard,notes,created_at,updated_at FROM students`).run(ownerId);
    db.exec("DROP TABLE students; ALTER TABLE students_r16 RENAME TO students;");
    db.exec("CREATE INDEX IF NOT EXISTS students_teacher_status_idx ON students(teacher_id,status)");
  } else if (hasTable("students") && ownerId) {
    db.prepare("UPDATE students SET teacher_id=? WHERE teacher_id IS NULL").run(ownerId);
  }

  if (hasTable("attachments") && !columns("attachments").includes("teacher_id")) {
    if (!ownerId && Number(db.prepare("SELECT COUNT(*) AS n FROM attachments").get().n) > 0) throw new Error("Attachment data exists but no owner");
    db.exec("ALTER TABLE attachments ADD COLUMN teacher_id INTEGER");
    if (ownerId) db.prepare("UPDATE attachments SET teacher_id=? WHERE teacher_id IS NULL").run(ownerId);
    db.exec("CREATE INDEX IF NOT EXISTS attachments_teacher_related_idx ON attachments(teacher_id,related_type,related_id)");
  }


  // R19: responsibility provenance + model-agnostic AI task packages.
  if (hasTable("submissions") && !columns("submissions").includes("responsible_student_name")) {
    db.exec("ALTER TABLE submissions ADD COLUMN responsible_student_name TEXT");
  }
  if (hasTable("submissions") && !columns("submissions").includes("responsible_student_no")) {
    db.exec("ALTER TABLE submissions ADD COLUMN responsible_student_no TEXT");
  }
  if (hasTable("attachments") && !columns("attachments").includes("source_student_name")) {
    db.exec("ALTER TABLE attachments ADD COLUMN source_student_name TEXT");
  }
  if (hasTable("attachments") && !columns("attachments").includes("source_student_no")) {
    db.exec("ALTER TABLE attachments ADD COLUMN source_student_no TEXT");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS paper_responsibility_transfers (
      id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      paper_id INTEGER NOT NULL,
      from_student_id INTEGER NOT NULL,
      to_student_id INTEGER NOT NULL,
      transferred_at DATETIME,
      notes TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
      FOREIGN KEY (from_student_id) REFERENCES students(id) ON DELETE RESTRICT,
      FOREIGN KEY (to_student_id) REFERENCES students(id) ON DELETE RESTRICT,
      UNIQUE (paper_id,from_student_id,to_student_id)
    );
    CREATE INDEX IF NOT EXISTS paper_responsibility_transfers_from_idx ON paper_responsibility_transfers(from_student_id);
    CREATE INDEX IF NOT EXISTS paper_responsibility_transfers_to_idx ON paper_responsibility_transfers(to_student_id);

    CREATE TABLE IF NOT EXISTS prompt_templates (
      id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      task_type TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS prompt_templates_teacher_task_idx ON prompt_templates(teacher_id,task_type);

    CREATE TABLE IF NOT EXISTS ai_task_runs (
      id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      paper_id INTEGER,
      submission_id INTEGER,
      revision_id INTEGER,
      task_type TEXT NOT NULL,
      template_key TEXT,
      template_name TEXT,
      prompt_text TEXT NOT NULL,
      package_text TEXT NOT NULL,
      supplemental_text TEXT,
      result_text TEXT,
      result_status TEXT NOT NULL DEFAULT 'draft',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
      FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE SET NULL,
      FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE SET NULL,
      FOREIGN KEY (revision_id) REFERENCES revisions(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS ai_task_runs_teacher_task_idx ON ai_task_runs(teacher_id,task_type);
    CREATE INDEX IF NOT EXISTS ai_task_runs_revision_created_idx ON ai_task_runs(revision_id,created_at);
  `);

  // R19 ModelAssist final contract: preserve raw result, local parse, explicit human adoption and audit material.
  if (hasTable("ai_task_runs")) {
    const aiCols = new Set(columns("ai_task_runs"));
    const additions = [
      ["raw_result", "TEXT"],
      ["parsed_json", "TEXT"],
      ["accepted_json", "TEXT"],
      ["material_json", "TEXT"],
      ["parse_warnings_json", "TEXT"],
      ["parsed_at", "DATETIME"],
      ["accepted_at", "DATETIME"],
    ];
    for (const [name, type] of additions) {
      if (!aiCols.has(name)) db.exec(`ALTER TABLE ai_task_runs ADD COLUMN ${name} ${type}`);
    }
    db.prepare("UPDATE ai_task_runs SET raw_result=result_text WHERE raw_result IS NULL AND result_text IS NOT NULL").run();
    db.prepare("UPDATE ai_task_runs SET accepted_json='[]' WHERE accepted_json IS NULL").run();
  }

  // Repository builds intentionally avoid installation-specific data rewrites.
  // Existing records are preserved; schema migrations above are generic and idempotent.

  if (ownerId) {
    const hasSetting = db.prepare("SELECT 1 FROM teacher_settings WHERE teacher_id=?").get(ownerId);
    if (!hasSetting) db.prepare("INSERT INTO teacher_settings(teacher_id,config_json,updated_at) VALUES(?,?,CURRENT_TIMESTAMP)").run(ownerId, loadLegacyConfig());
  }


  // Remove obsolete direct-model/API settings and keep only portable AI task-package defaults.
  for (const row of db.prepare("SELECT id,config_json FROM teacher_settings").all()) {
    let cfg = {};
    try { cfg = JSON.parse(row.config_json || "{}"); } catch {}
    delete cfg.aiMode; delete cfg.aiApiKey; delete cfg.aiApiUrl; delete cfg.aiModel;
    cfg.aiPackageDefaults = {
      includeEditorDecision: true,
      includeReviewerComments: true,
      includeRevisionHistory: true,
      includeSubmissionHistory: true,
      includeResponsibilityHistory: true,
      includeAttachments: true,
      ...(cfg.aiPackageDefaults || {})
    };
    const nextConfig = JSON.stringify(cfg);
    if (nextConfig !== String(row.config_json || "")) {
      db.prepare("UPDATE teacher_settings SET config_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=?")
        .run(nextConfig, row.id);
    }
  }

  db.exec("PRAGMA foreign_keys=ON");
  const integrity = db.prepare("PRAGMA integrity_check").get();
  const claim = ensureLegacyClaimCode();
  console.log(`R19 database ready: ${dbPath}`);
  console.log(`integrity_check=${integrity.integrity_check || Object.values(integrity)[0]}`);
  console.log(`teachers=${db.prepare("SELECT COUNT(*) AS n FROM teachers").get().n}, students=${hasTable("students") ? db.prepare("SELECT COUNT(*) AS n FROM students").get().n : 0}`);
  if (claim) {
    console.log("Existing data is waiting for its owner to claim it.");
    console.log(`Legacy data claim code: ${claim.code}`);
    console.log(`Claim code source: ${claim.source}`);
  }
} finally {
  db.close();
}
