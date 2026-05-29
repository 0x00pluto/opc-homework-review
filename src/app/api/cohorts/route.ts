import { NextRequest } from "next/server";
import { createCohort, listCohorts } from "@/lib/api-handlers";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  getDb();
  return listCohorts();
}

export async function POST(request: NextRequest) {
  getDb();
  const body = await request.json();
  return createCohort(body);
}
