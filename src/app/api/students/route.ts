import { NextRequest } from "next/server";
import { createStudent, listStudents } from "@/lib/api-handlers";
import { ensureDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  await ensureDb();
  return await listStudents();
}

export async function POST(request: NextRequest) {
  await ensureDb();
  const body = await request.json();
  return await createStudent(body);
}
