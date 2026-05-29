import { getHomeworksByStudent } from "@/lib/api-handlers";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ student_id: string }> };

export async function GET(_request: Request, { params }: Params) {
  getDb();
  const { student_id } = await params;
  return getHomeworksByStudent(student_id);
}
