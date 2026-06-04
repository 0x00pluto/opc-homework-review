import { NextRequest, NextResponse } from "next/server";
import {
  createAssignment,
  getAssignments,
} from "@/lib/api-handlers";
import { ensureDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await ensureDb();
  const cohort = request.nextUrl.searchParams.get("cohort");
  const data = await getAssignments(cohort);
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  await ensureDb();
  const body = await request.json();
  return await createAssignment(body);
}
