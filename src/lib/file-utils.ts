import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOAD_ROOT = path.join(process.cwd(), "data", "files");
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "image/png",
  "image/jpeg",
];
const MAX_SIZE = 50 * 1024 * 1024;

export async function saveFile(
  buffer: Buffer,
  originalName: string,
  category: string,
  entityId: number,
  mimeType: string,
): Promise<{ fileName: string; filePath: string; fileSize: number; fileType: string }> {
  const dir = path.join(UPLOAD_ROOT, category);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  const timestamp = Date.now();
  const safeName = originalName.replace(/[^a-zA-Z0-9._\-一-龥一-鿿]/g, "_");
  const fileName = `${category}_${entityId}_${timestamp}_${safeName}`;
  const filePath = path.join(dir, fileName);

  await writeFile(filePath, buffer);

  return {
    fileName: originalName,
    filePath: `${category}/${fileName}`,
    fileSize: buffer.length,
    fileType: mimeType,
  };
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: `不支持的文件类型: ${file.type}` };
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: "文件大小不能超过50MB" };
  }
  return { valid: true };
}

export function getFilePath(relativePath: string): string {
  return path.join(UPLOAD_ROOT, relativePath);
}
