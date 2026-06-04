import { NextRequest } from "next/server";
import { getHomeworkById, updateHomework } from "@/lib/api-handlers";
import { ensureDb } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  await ensureDb();
  const { id } = await params;
  const role = request.nextUrl.searchParams.get("role");
  return await getHomeworkById(id, role);
}

export async function PUT(request: NextRequest, { params }: Params) {
  await ensureDb();
  const { id } = await params;
  const body = await request.json();
  return await updateHomework(id, body);
}
