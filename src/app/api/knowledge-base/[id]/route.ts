import { deleteKnowledgeBase } from "@/lib/api-handlers";
import { ensureDb } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  await ensureDb();
  const { id } = await params;
  return await deleteKnowledgeBase(id);
}
