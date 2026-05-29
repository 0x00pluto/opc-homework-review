import { NextRequest } from "next/server";
import { saveUploadedFile } from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return Response.json({ error: "请上传文件" }, { status: 400 });
  }

  return saveUploadedFile(file);
}
