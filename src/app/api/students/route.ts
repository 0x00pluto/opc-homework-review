import { NextRequest } from "next/server";
import { createStudent, listStudents } from "@/lib/api-handlers";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  getDb();
  return listStudents();
}

export async function POST(request: NextRequest) {
  getDb();
  const body = await request.json();
  return createStudent(body);
}
