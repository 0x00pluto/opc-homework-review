import { NextRequest } from "next/server";
import { loginStudent } from "@/lib/api-handlers";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  getDb();
  const body = await request.json();
  return loginStudent(body);
}
