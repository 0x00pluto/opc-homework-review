import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads", "homework");
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
]);

export function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._\u4e00-\u9fff-]/g, "_");
}

export function isAllowedExtension(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext);
}

export function resolveStoredFile(storedName: string) {
  const base = path.basename(storedName);
  const resolved = path.join(UPLOAD_DIR, base);
  if (!resolved.startsWith(UPLOAD_DIR)) {
    return null;
  }
  return resolved;
}

export async function saveUploadedFile(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "文件大小不能超过 10MB" }, { status: 400 });
  }

  if (!isAllowedExtension(file.name)) {
    return NextResponse.json(
      { error: "不支持的文件类型，仅允许 PDF、Word、Excel、图片" },
      { status: 400 },
    );
  }

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const id = randomUUID();
  const storedName = `${id}_${sanitizeFilename(file.name)}`;
  const filePath = path.join(UPLOAD_DIR, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  return NextResponse.json({
    id,
    original_name: file.name,
    stored_name: storedName,
    mime_type: file.type || "application/octet-stream",
    size: file.size,
    url: `/api/uploads/${encodeURIComponent(storedName)}`,
  });
}
