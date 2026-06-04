import { getStudentGrowth } from "@/lib/api-handlers";
import { ensureDb } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ student_id: string }> };

export async function GET(_request: Request, { params }: Params) {
  await ensureDb();
  const { student_id } = await params;
  return await getStudentGrowth(student_id);
}
