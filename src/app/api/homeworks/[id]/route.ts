import { NextRequest } from "next/server";
import { getHomeworkById, updateHomework } from "@/lib/api-handlers";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  getDb();
  const { id } = await params;
  const role = request.nextUrl.searchParams.get("role");
  return getHomeworkById(id, role);
}

export async function PUT(request: NextRequest, { params }: Params) {
  getDb();
  const { id } = await params;
  const body = await request.json();
  return updateHomework(id, body);
}
