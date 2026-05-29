import fs from "fs";
import path from "path";
import { resolveStoredFile } from "@/lib/uploads";

export const runtime = "nodejs";

type Params = { params: Promise<{ filename: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { filename } = await params;
  const decoded = decodeURIComponent(filename);
  const filePath = resolveStoredFile(decoded);

  if (!filePath || !fs.existsSync(filePath)) {
    return Response.json({ error: "文件不存在" }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(decoded).toLowerCase();
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

  return new Response(buffer, {
    headers: {
      "Content-Type": mimeMap[ext] || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(decoded)}"`,
    },
  });
}
