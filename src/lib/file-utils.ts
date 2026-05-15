import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { getSettings } from "./settings";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "image/png",
  "image/jpeg",
  "application/zip",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
];
const MAX_SIZE = 50 * 1024 * 1024;

function resolveRoot(): string {
  const settings = getSettings();
  const dir = settings.fileRootDir;
  // If absolute path (Windows: D:\... or Unix: /...), use directly
  if (path.isAbsolute(dir) || /^[A-Z]:\\/i.test(dir)) {
    return dir;
  }
  return path.join(process.cwd(), dir);
}

export async function saveFile(
  buffer: Buffer,
  originalName: string,
  category: string,
  entityId: number,
  mimeType: string,
  studentDir?: string,
  subDir?: string,
): Promise<{ fileName: string; filePath: string; fileSize: number; fileType: string }> {
  const root = resolveRoot();
  let dir: string;
  if (studentDir && subDir) {
    dir = path.join(root, studentDir, subDir);
  } else if (studentDir) {
    dir = path.join(root, studentDir, category);
  } else {
    dir = path.join(root, category);
  }
  try {
    await mkdir(dir, { recursive: true });
  } catch {
    // Fallback: ensure root exists first, then create subdirs
    if (!existsSync(root)) {
      await mkdir(root, { recursive: true });
    }
    // Now create relative sub-path from root
    const rel = path.relative(root, dir);
    if (rel && !existsSync(dir)) {
      const parts = rel.split(path.sep);
      let current = root;
      for (const part of parts) {
        if (!part) continue;
        current = path.join(current, part);
        if (!existsSync(current)) {
          await mkdir(current);
        }
      }
    }
  }

  const timestamp = Date.now();
  const safeName = originalName.replace(/[^a-zA-Z0-9._\-一-鿿]/g, "_");
  const fileName = `${category}_${entityId}_${timestamp}_${safeName}`;
  const fullPath = path.join(dir, fileName);

  await writeFile(fullPath, buffer);

  // Store path relative to root for download
  const relPath = path.relative(root, fullPath).replace(/\\/g, "/");

  return {
    fileName: originalName,
    filePath: relPath,
    fileSize: buffer.length,
    fileType: mimeType,
  };
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.type && !ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: `不支持的文件类型: ${file.type || "未知"}` };
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: "文件大小不能超过50MB" };
  }
  return { valid: true };
}

export function getFilePath(relativePath: string): string {
  return path.join(resolveRoot(), relativePath);
}
