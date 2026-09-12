import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { clearGeneratedLegacyClaimCode, verifyLegacyClaimCode } from "@/lib/legacy-claim";

export type TeacherRow = {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  status: string;
};

function dbPath() {
  return path.join(process.cwd(), "prisma", "data", "dev.db");
}

function openDb() {
  const db = new DatabaseSync(dbPath());
  db.exec("PRAGMA foreign_keys=ON");
  return db;
}

function mapTeacher(row: any): TeacherRow | null {
  if (!row) return null;
  return {
    id: Number(row.id),
    name: String(row.name),
    email: String(row.email),
    passwordHash: String(row.password_hash),
    status: String(row.status),
  };
}

export function findTeacherByEmail(email: string): TeacherRow | null {
  const db = openDb();
  try {
    return mapTeacher(db.prepare("SELECT id,name,email,password_hash,status FROM teachers WHERE email=? LIMIT 1").get(email));
  } finally { db.close(); }
}

export function findActiveTeacherBySession(id: number, email: string) {
  const db = openDb();
  try {
    const row: any = db.prepare("SELECT id,name,email,status FROM teachers WHERE id=? AND email=? AND status='active' LIMIT 1").get(id, email);
    return row ? { id: Number(row.id), name: String(row.name), email: String(row.email), status: String(row.status) } : null;
  } finally { db.close(); }
}

export function hasPendingLegacyClaim() {
  const db = openDb();
  try {
    return Boolean(db.prepare("SELECT 1 FROM teachers WHERE status='pending_claim' LIMIT 1").get());
  } finally { db.close(); }
}

export function registerTeacher(args: {
  name: string;
  email: string;
  passwordHash: string;
  defaultSettingsJson: string;
  claimCode?: string | null;
}) {
  const db = openDb();
  try {
    db.exec("BEGIN IMMEDIATE");
    const exists = db.prepare("SELECT id FROM teachers WHERE email=? LIMIT 1").get(args.email);
    if (exists) {
      db.exec("ROLLBACK");
      return { ok: false as const, reason: "exists" as const };
    }

    const legacy: any = db.prepare("SELECT id FROM teachers WHERE status='pending_claim' ORDER BY id LIMIT 1").get();
    const claimRequested = Boolean((args.claimCode || "").trim());
    if (claimRequested && (!legacy || !verifyLegacyClaimCode(args.claimCode))) {
      db.exec("ROLLBACK");
      return { ok: false as const, reason: "invalid_claim" as const };
    }

    const result: any = db.prepare(`INSERT INTO teachers(name,email,password_hash,status,created_at,updated_at)
      VALUES(?,?,?,'active',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).run(args.name, args.email, args.passwordHash);
    const teacherId = Number(result.lastInsertRowid);
    let claimedLegacy = false;

    if (legacy && claimRequested) {
      const legacyId = Number(legacy.id);
      db.prepare("UPDATE students SET teacher_id=? WHERE teacher_id=?").run(teacherId, legacyId);
      db.prepare("UPDATE attachments SET teacher_id=? WHERE teacher_id=?").run(teacherId, legacyId);
      const legacySetting: any = db.prepare("SELECT id FROM teacher_settings WHERE teacher_id=? LIMIT 1").get(legacyId);
      if (legacySetting) {
        db.prepare("UPDATE teacher_settings SET teacher_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").run(teacherId, Number(legacySetting.id));
      } else {
        db.prepare("INSERT INTO teacher_settings(teacher_id,config_json,created_at,updated_at) VALUES(?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)")
          .run(teacherId, args.defaultSettingsJson);
      }
      db.prepare("DELETE FROM teachers WHERE id=?").run(legacyId);
      claimedLegacy = true;
    } else {
      db.prepare("INSERT INTO teacher_settings(teacher_id,config_json,created_at,updated_at) VALUES(?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)")
        .run(teacherId, args.defaultSettingsJson);
    }

    db.exec("COMMIT");
    if (claimedLegacy) clearGeneratedLegacyClaimCode();
    return { ok: true as const, teacher: { id: teacherId, name: args.name, email: args.email }, claimedLegacy };
  } catch (error) {
    try { db.exec("ROLLBACK"); } catch {}
    throw error;
  } finally { db.close(); }
}
