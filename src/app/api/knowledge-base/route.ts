import { NextRequest } from "next/server";
import {
  createKnowledgeBase,
  listKnowledgeBase,
} from "@/lib/api-handlers";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  getDb();
  return listKnowledgeBase();
}

export async function POST(request: NextRequest) {
  getDb();
  const body = await request.json();
  return createKnowledgeBase(body);
}
