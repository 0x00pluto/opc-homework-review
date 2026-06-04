import { dbOne } from "./db-query";
import { getActiveAgentsCount, MAX_AGENTS, processHomework } from "./agents";

const CRON_BATCH_LIMIT = 5;

export async function enqueueHomeworkProcessing(homeworkId: number) {
  const row = await dbOne<{ homework_link: string }>(
    "SELECT homework_link FROM opc_homework_records WHERE id = ? AND status = 'WAITING_REVIEW'",
    [homeworkId],
  );
  if (!row) return;
  await processHomework(homeworkId, row.homework_link);
}

export async function processNextWaitingHomework(): Promise<boolean> {
  if ((await getActiveAgentsCount()) >= MAX_AGENTS) return false;

  const waiting = await dbOne<{ id: number; homework_link: string }>(
    "SELECT id, homework_link FROM opc_homework_records WHERE status = 'WAITING_REVIEW' ORDER BY submission_time ASC LIMIT 1",
  );
  if (!waiting) return false;

  await processHomework(waiting.id, waiting.homework_link);
  return true;
}

export async function processWaitingHomeworkBatch(
  limit = CRON_BATCH_LIMIT,
): Promise<number> {
  let processed = 0;
  for (let i = 0; i < limit; i++) {
    const didProcess = await processNextWaitingHomework();
    if (!didProcess) break;
    processed++;
  }
  return processed;
}
