import path from "path";
import { fetchBlobByStoredName, mimeForExtension } from "@/lib/uploads";

export const runtime = "nodejs";

type Params = { params: Promise<{ filename: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { filename } = await params;
  const decoded = decodeURIComponent(filename);
  const base = path.basename(decoded);

  const meta = await fetchBlobByStoredName(base);
  if (!meta?.url) {
    return Response.json({ error: "文件不存在" }, { status: 404 });
  }

  const upstream = await fetch(meta.url);
  if (!upstream.ok) {
    return Response.json({ error: "文件读取失败" }, { status: 502 });
  }

  const buffer = await upstream.arrayBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type": meta.contentType || mimeForExtension(base),
      "Content-Disposition": `attachment; filename="${encodeURIComponent(base)}"`,
    },
  });
}
