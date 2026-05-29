import { NextRequest } from "next/server";
import { deleteCohort, updateCohort } from "@/lib/api-handlers";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  getDb();
  const { id } = await params;
  const body = await request.json();
  return updateCohort(id, body);
}

export async function DELETE(_request: Request, { params }: Params) {
  getDb();
  const { id } = await params;
  return deleteCohort(id);
}
