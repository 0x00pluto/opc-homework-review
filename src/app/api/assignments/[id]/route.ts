import { NextRequest } from "next/server";
import { deleteAssignment, updateAssignment } from "@/lib/api-handlers";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  getDb();
  const { id } = await params;
  const body = await request.json();
  return updateAssignment(id, body);
}

export async function DELETE(_request: Request, { params }: Params) {
  getDb();
  const { id } = await params;
  return deleteAssignment(id);
}
