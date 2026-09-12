import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export type SubmissionManuscriptMeta = {
  manuscriptTitle: string | null;
  firstAuthor: string | null;
  correspondingAuthor: string | null;
};

function openDb(readOnly = true) {
  return new DatabaseSync(path.join(process.cwd(), "prisma", "data", "dev.db"), { readOnly });
}

function ensureColumns(db: any) {
  const cols = new Set((db.prepare("PRAGMA table_info(submissions)").all() as Array<{ name: string }>).map((r) => r.name));
  if (!cols.has("manuscript_title")) db.exec("ALTER TABLE submissions ADD COLUMN manuscript_title TEXT");
  if (!cols.has("first_author")) db.exec("ALTER TABLE submissions ADD COLUMN first_author TEXT");
  if (!cols.has("corresponding_author")) db.exec("ALTER TABLE submissions ADD COLUMN corresponding_author TEXT");
}

export function getSubmissionManuscriptMetaMap(ids: number[]) {
  const result = new Map<number, SubmissionManuscriptMeta>();
  if (!ids.length) return result;
  const db = openDb(true);
  try {
    const cols = new Set((db.prepare("PRAGMA table_info(submissions)").all() as Array<{ name: string }>).map((r) => r.name));
    if (!["manuscript_title", "first_author", "corresponding_author"].every((name) => cols.has(name))) return result;
    const placeholders = ids.map(() => "?").join(",");
    const rows = db.prepare(`SELECT id, manuscript_title, first_author, corresponding_author FROM submissions WHERE id IN (${placeholders})`).all(...ids) as Array<{
      id: number; manuscript_title: string | null; first_author: string | null; corresponding_author: string | null;
    }>;
    for (const row of rows) {
      result.set(Number(row.id), {
        manuscriptTitle: row.manuscript_title ?? null,
        firstAuthor: row.first_author ?? null,
        correspondingAuthor: row.corresponding_author ?? null,
      });
    }
    return result;
  } finally {
    db.close();
  }
}

export function saveSubmissionManuscriptMeta(id: number, meta: SubmissionManuscriptMeta) {
  const db = openDb(false);
  try {
    ensureColumns(db);
    db.prepare(`UPDATE submissions SET manuscript_title = ?, first_author = ?, corresponding_author = ? WHERE id = ?`).run(
      meta.manuscriptTitle || null,
      meta.firstAuthor || null,
      meta.correspondingAuthor || null,
      id,
    );
  } finally {
    db.close();
  }
}
