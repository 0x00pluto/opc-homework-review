import { getAgentStatus } from "@/lib/api-handlers";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  getDb();
  return getAgentStatus();
}
