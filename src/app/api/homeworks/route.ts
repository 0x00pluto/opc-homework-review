import { NextRequest } from "next/server";
import { createHomework, listHomeworks } from "@/lib/api-handlers";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  getDb();
  return listHomeworks();
}

export async function POST(request: NextRequest) {
  getDb();
  const body = await request.json();
  return createHomework(body);
}
