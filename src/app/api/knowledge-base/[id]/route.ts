import { deleteKnowledgeBase } from "@/lib/api-handlers";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  getDb();
  const { id } = await params;
  return deleteKnowledgeBase(id);
}
