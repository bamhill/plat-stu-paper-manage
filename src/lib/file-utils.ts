import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { getSettings } from "./settings";

const ALLOWED_TYPES = [
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain", "image/png", "image/jpeg", "application/zip", "application/x-zip-compressed",
  "application/x-rar-compressed", "application/x-7z-compressed", "application/octet-stream",
];
const MAX_SIZE = 50 * 1024 * 1024;

async function resolveRoot(teacherId: number): Promise<string> {
  const settings = await getSettings(teacherId);
  const dir = settings.fileRootDir;
  if (path.isAbsolute(dir) || /^[A-Z]:\\/i.test(dir)) return dir;
  return path.join(process.cwd(), dir);
}

export async function saveFile(
  teacherId: number,
  buffer: Buffer,
  originalName: string,
  category: string,
  entityId: number,
  mimeType: string,
  studentDir?: string,
  subDir?: string,
): Promise<{ fileName: string; filePath: string; fileSize: number; fileType: string }> {
  const root = await resolveRoot(teacherId);
  const tenantRoot = path.join(root, `teacher_${teacherId}`);
  let dir: string;
  if (studentDir && subDir) dir = path.join(tenantRoot, studentDir, subDir);
  else if (studentDir) dir = path.join(tenantRoot, studentDir, category);
  else dir = path.join(tenantRoot, category);

  try {
    await mkdir(dir, { recursive: true });
  } catch {
    if (!existsSync(root)) await mkdir(root, { recursive: true });
    if (!existsSync(tenantRoot)) await mkdir(tenantRoot, { recursive: true });
    const rel = path.relative(tenantRoot, dir);
    if (rel && !existsSync(dir)) {
      const parts = rel.split(path.sep);
      let current = tenantRoot;
      for (const part of parts) {
        if (!part) continue;
        current = path.join(current, part);
        if (!existsSync(current)) await mkdir(current);
      }
    }
  }

  const timestamp = Date.now();
  const safeName = originalName.replace(/[^a-zA-Z0-9._\-一-鿿]/g, "_");
  const fileName = `${category}_${entityId}_${timestamp}_${safeName}`;
  const fullPath = path.join(dir, fileName);
  await writeFile(fullPath, buffer);
  const relPath = path.relative(root, fullPath).replace(/\\/g, "/");
  return { fileName: originalName, filePath: relPath, fileSize: buffer.length, fileType: mimeType };
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.type && !ALLOWED_TYPES.includes(file.type)) return { valid: false, error: `不支持的文件类型: ${file.type || "未知"}` };
  if (file.size > MAX_SIZE) return { valid: false, error: "文件大小不能超过50MB" };
  return { valid: true };
}

export async function getFilePath(teacherId: number, relativePath: string): Promise<string> {
  const root = await resolveRoot(teacherId);
  const full = path.resolve(root, relativePath);
  const normalizedRoot = path.resolve(root) + path.sep;
  if (!(full + path.sep).startsWith(normalizedRoot) && full !== path.resolve(root)) throw new Error("Invalid file path");
  return full;
}
