import { getInstructorWorkload } from "@/lib/api-handlers";
import { ensureDb } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ instructor_id: string }> };

export async function GET(_request: Request, { params }: Params) {
  await ensureDb();
  const { instructor_id } = await params;
  return await getInstructorWorkload(instructor_id);
}
