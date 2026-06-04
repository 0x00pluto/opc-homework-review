import { NextRequest } from "next/server";
import { updateHomeworkFeedback } from "@/lib/api-handlers";
import { ensureDb } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  await ensureDb();
  const { id } = await params;
  const body = await request.json();
  return await updateHomeworkFeedback(id, body);
}
