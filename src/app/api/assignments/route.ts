import { NextRequest, NextResponse } from "next/server";
import {
  createAssignment,
  getAssignments,
} from "@/lib/api-handlers";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  getDb();
  const cohort = request.nextUrl.searchParams.get("cohort");
  return NextResponse.json(getAssignments(cohort));
}

export async function POST(request: NextRequest) {
  getDb();
  const body = await request.json();
  return createAssignment(body);
}
