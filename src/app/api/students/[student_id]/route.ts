import { NextRequest } from "next/server";
import {
  deleteStudent,
  getStudent,
  updateStudent,
} from "@/lib/api-handlers";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ student_id: string }> };

export async function GET(_request: Request, { params }: Params) {
  getDb();
  const { student_id } = await params;
  return getStudent(student_id);
}

export async function PUT(request: NextRequest, { params }: Params) {
  getDb();
  const { student_id } = await params;
  const body = await request.json();
  return updateStudent(student_id, body);
}

export async function DELETE(_request: Request, { params }: Params) {
  getDb();
  const { student_id } = await params;
  return deleteStudent(student_id);
}
