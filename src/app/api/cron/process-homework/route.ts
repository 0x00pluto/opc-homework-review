import { processWaitingHomeworkBatch } from "@/lib/agent-queue";
import { ensureDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "CRON_SECRET 未配置" }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureDb();
  const processed = await processWaitingHomeworkBatch();

  return Response.json({ success: true, processed });
}
