import { getAgentStatus } from "@/lib/api-handlers";
import { ensureDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  await ensureDb();
  return await getAgentStatus();
}
