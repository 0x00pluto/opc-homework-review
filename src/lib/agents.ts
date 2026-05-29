import { getDb } from "./db";
import {
  buildDimensionScores,
  buildOverallScore,
} from "./stats-constants";

let activeAgents = 0;
const MAX_AGENTS = 5;

export async function getActiveAgentsCount() {
  return activeAgents;
}

const OPC_MANUAL = `
《OPC产品说明手册》:
针对大龄（35岁以上）、面临职业转型、需要极大心理建设和实操指导的独立创作者群体。
核心理念：一人公司，打造个人超级IP，建立信任，出售知识或服务。
我们的评审语言应具有极高的同理心、正向反馈，能够平复转型的焦虑。
`;

const DAY2_TASK = `
[Day2-任务说明]:
学员需要提交一篇讲述自己为何想成为超级个体的短文（不少于200字）。
要求逻辑自洽，体现真实情感。
`;

export async function processHomework(homeworkId: number, content: string) {
  const db = getDb();

  if (activeAgents >= MAX_AGENTS) {
    throw new Error("All agents are busy. Task queued.");
  }

  activeAgents++;
  const startTime = Date.now();
  let resultState = "SUCCESS";

  db.prepare("UPDATE opc_homework_records SET status = ? WHERE id = ?").run(
    "PROCESSING",
    homeworkId,
  );

  try {
    // MOCK API CALL — prompt built for future Gemini integration
    void OPC_MANUAL;
    void DAY2_TASK;
    void content;

    await new Promise((resolve) => setTimeout(resolve, 2000));
    const overallScore = buildOverallScore(homeworkId);
    const dimensionScores = buildDimensionScores(homeworkId);
    const parsed = {
      feedback_content:
        "这份作业充满了真诚与反思，能深切感受到你在转型期的思考与决心。保持积极的心态，一人公司的路虽然充满挑战，但也意味着无限的可能！\n\n**建议：**\n1. 尝试在第二段中加入一个具体的、甚至有些痛苦的小故事，这样能立刻拉近与潜在客户的心理距离（他们也有相似的痛）。\n2. 结尾处可以更加笃定一些，给出你的核心交付价值（比如你会如何帮助别人）。",
      is_low_quality: false,
      overall_score: overallScore,
      dimension_scores: JSON.stringify(dimensionScores),
    };

    db.prepare(
      `INSERT INTO opc_ai_feedbacks
       (homework_id, feedback_content, is_low_quality, overall_score, dimension_scores)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(
      homeworkId,
      parsed.feedback_content,
      parsed.is_low_quality ? 1 : 0,
      parsed.overall_score,
      parsed.dimension_scores,
    );

    db.prepare(
      `UPDATE opc_homework_records SET status = ?, pending_audit_at = CURRENT_TIMESTAMP WHERE id = ?`,
    ).run("PENDING_AUDIT", homeworkId);
  } catch (err) {
    console.error("Agent processing error:", err);
    resultState = "FAILED";
    db.prepare("UPDATE opc_homework_records SET status = ? WHERE id = ?").run(
      "WAITING_REVIEW",
      homeworkId,
    );
  } finally {
    const executionTime = Date.now() - startTime;
    db.prepare(
      "INSERT INTO sys_agent_logs (agent_thread_id, target_homework_id, execution_time, result_state) VALUES (?, ?, ?, ?)",
    ).run(activeAgents, homeworkId, executionTime, resultState);
    activeAgents--;
  }
}

let isPolling = false;

export async function startPollingAgents() {
  if (isPolling) return;
  isPolling = true;

  setInterval(async () => {
    if (activeAgents >= MAX_AGENTS) return;

    try {
      const db = getDb();
      const waiting = db
        .prepare(
          "SELECT id, homework_link FROM opc_homework_records WHERE status = 'WAITING_REVIEW' ORDER BY submission_time ASC LIMIT 1",
        )
        .get() as { id: number; homework_link: string } | undefined;

      if (waiting) {
        processHomework(waiting.id, waiting.homework_link).catch(console.error);
      }
    } catch (e) {
      console.error("Polling error", e);
    }
  }, 3000);
}
