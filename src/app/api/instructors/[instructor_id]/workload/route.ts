import { getInstructorWorkload } from "@/lib/api-handlers";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ instructor_id: string }> };

export async function GET(_request: Request, { params }: Params) {
  getDb();
  const { instructor_id } = await params;
  return getInstructorWorkload(instructor_id);
}
