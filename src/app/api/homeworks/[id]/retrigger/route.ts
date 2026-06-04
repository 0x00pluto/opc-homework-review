import { retriggerHomework } from "@/lib/api-handlers";
import { ensureDb } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  await ensureDb();
  const { id } = await params;
  let body: { instructor_id?: string } = {};
  try {
    body = await request.json();
  } catch {
    // empty body allowed
  }
  return await retriggerHomework(id, body);
}
