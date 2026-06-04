import { NextRequest } from "next/server";
import { createHomework, listHomeworks } from "@/lib/api-handlers";
import { ensureDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  await ensureDb();
  return await listHomeworks();
}

export async function POST(request: NextRequest) {
  await ensureDb();
  const body = await request.json();
  return await createHomework(body);
}
