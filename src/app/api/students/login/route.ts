import { NextRequest } from "next/server";
import { loginStudent } from "@/lib/api-handlers";
import { ensureDb } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  await ensureDb();
  const body = await request.json();
  return await loginStudent(body);
}
