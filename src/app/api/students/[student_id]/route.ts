import { NextRequest } from "next/server";
import {
  deleteStudent,
  getStudent,
  updateStudent,
} from "@/lib/api-handlers";
import { ensureDb } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ student_id: string }> };

export async function GET(_request: Request, { params }: Params) {
  await ensureDb();
  const { student_id } = await params;
  return await getStudent(student_id);
}

export async function PUT(request: NextRequest, { params }: Params) {
  await ensureDb();
  const { student_id } = await params;
  const body = await request.json();
  return await updateStudent(student_id, body);
}

export async function DELETE(_request: Request, { params }: Params) {
  await ensureDb();
  const { student_id } = await params;
  return await deleteStudent(student_id);
}
