import path from "path";
import { put, head } from "@vercel/blob";
import { NextResponse } from "next/server";

export const BLOB_PREFIX = "homework/";
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

export function blobPathname(storedName: string) {
  const base = path.basename(storedName);
  return `${BLOB_PREFIX}${base}`;
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

  const storedName = `${crypto.randomUUID()}_${sanitizeFilename(file.name)}`;
  const pathname = blobPathname(storedName);
  const buffer = Buffer.from(await file.arrayBuffer());

  const blob = await put(pathname, buffer, {
    access: "public",
    contentType: file.type || "application/octet-stream",
  });

  return NextResponse.json({
    id: crypto.randomUUID(),
    original_name: file.name,
    stored_name: storedName,
    mime_type: file.type || "application/octet-stream",
    size: file.size,
    url: blob.url,
  });
}

export async function fetchBlobByStoredName(storedName: string) {
  const pathname = blobPathname(storedName);
  try {
    const meta = await head(pathname);
    return meta;
  } catch {
    return null;
  }
}

export function mimeForExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
  };
  return mimeMap[ext] || "application/octet-stream";
}
