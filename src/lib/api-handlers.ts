import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { endOfWeek, startOfWeek } from "date-fns";
import { zhCN } from "date-fns/locale";
import { enqueueHomeworkProcessing } from "@/lib/agent-queue";
import { getActiveAgentsCount } from "@/lib/agents";
import {
  dbAll,
  dbLastInsertId,
  dbOne,
  dbRun,
  isPrimaryKeyConstraintError,
  isUniqueConstraintError,
} from "@/lib/db-query";
import {
  GROWTH_DIMENSIONS,
  SUGGESTION_TEMPLATES,
} from "@/lib/stats-constants";
import type { HomeworkAttachment } from "@/types";

function normalizeCohortName(name?: string) {
  if (!name || name === "全服") return "全员";
  return name;
}

function getDefaultDeadlineAt() {
  const d = new Date();
  d.setHours(20, 0, 0, 0);
  return d.toISOString();
}

function parseAttachments(raw: unknown): HomeworkAttachment[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as HomeworkAttachment[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function serializeAttachments(attachments?: HomeworkAttachment[]) {
  return JSON.stringify(attachments ?? []);
}

function checkSubmissionDeadline(assignment: {
  deadline_at?: string | null;
  allow_late_submit?: number | boolean | null;
}) {
  if (!assignment.deadline_at) {
    return { allowed: true, isLate: false };
  }

  const deadline = new Date(assignment.deadline_at);
  const now = new Date();
  if (now <= deadline) {
    return { allowed: true, isLate: false };
  }

  const allowLate =
    assignment.allow_late_submit !== 0 &&
    assignment.allow_late_submit !== false;
  if (!allowLate) {
    return { allowed: false, isLate: false };
  }

  return { allowed: true, isLate: true };
}

export async function getAssignments(cohort?: string | null) {
  if (cohort) {
    return dbAll(
      "SELECT * FROM opc_assignments WHERE cohort_name = ? OR cohort_name = '全员' OR cohort_name = '全服' ORDER BY created_at DESC",
      [cohort],
    );
  }
  return dbAll(
    "SELECT * FROM opc_assignments ORDER BY created_at DESC",
  );
}

export async function createAssignment(body: {
  title?: string;
  description?: string;
  cohort_name?: string;
  deadline_at?: string;
  allow_late_submit?: boolean;
}) {
  const { title, description, cohort_name, deadline_at, allow_late_submit } =
    body;
  if (!title || !description) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }
  await dbRun(
    "INSERT INTO opc_assignments (title, description, cohort_name, deadline_at, allow_late_submit) VALUES (?, ?, ?, ?, ?)",
    [
      title,
      description,
      normalizeCohortName(cohort_name),
      deadline_at || getDefaultDeadlineAt(),
      allow_late_submit === false ? 0 : 1,
    ],
  );
  return NextResponse.json({ success: true });
}

export async function updateAssignment(
  id: string,
  body: {
    title?: string;
    description?: string;
    cohort_name?: string;
    deadline_at?: string;
    allow_late_submit?: boolean;
  },
) {
  const { title, description, cohort_name, deadline_at, allow_late_submit } =
    body;
  if (!title || !description) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }
  const existing = await dbOne<{ id: number }>(
    "SELECT id FROM opc_assignments WHERE id = ?",
    [id],
  );
  if (!existing) {
    return NextResponse.json({ error: "作业不存在" }, { status: 404 });
  }
  await dbRun(
    `UPDATE opc_assignments SET title = ?, description = ?, cohort_name = ?,
     deadline_at = ?, allow_late_submit = ? WHERE id = ?`,
    [
      title,
      description,
      normalizeCohortName(cohort_name),
      deadline_at || getDefaultDeadlineAt(),
      allow_late_submit === false ? 0 : 1,
      id,
    ],
  );
  return NextResponse.json({ success: true });
}

export async function deleteAssignment(id: string) {
  const existing = await dbOne<{ id: number }>(
    "SELECT id FROM opc_assignments WHERE id = ?",
    [id],
  );
  if (!existing) {
    return NextResponse.json({ error: "作业不存在" }, { status: 404 });
  }
  const submission = await dbOne<{ c: number }>(
    "SELECT COUNT(*) as c FROM opc_homework_records WHERE assignment_id = ?",
    [id],
  );
  if ((submission?.c ?? 0) > 0) {
    return NextResponse.json(
      { error: "已有学员提交，不可删除" },
      { status: 400 },
    );
  }
  await dbRun("DELETE FROM opc_assignments WHERE id = ?", [id]);
  return NextResponse.json({ success: true });
}

export async function listHomeworks() {
  const homeworks = await dbAll(
    `
    SELECT h.*, a.title as assignment_title 
    FROM opc_homework_records h 
    LEFT JOIN opc_assignments a ON h.assignment_id = a.id 
    ORDER BY h.submission_time DESC
  `,
  );
  return NextResponse.json(homeworks);
}

export async function createHomework(body: {
  student_id?: string;
  content?: string;
  assignment_id?: number;
  attachments?: HomeworkAttachment[];
}) {
  const { student_id, content, assignment_id, attachments } = body;
  const textContent = content?.trim() ?? "";
  const attachmentList = attachments ?? [];

  if (!student_id || (!textContent && attachmentList.length === 0)) {
    return NextResponse.json(
      { error: "请填写文本内容或上传至少一个附件" },
      { status: 400 },
    );
  }

  let isLate = 0;

  if (assignment_id) {
    const assignment = await dbOne<{
      deadline_at?: string | null;
      allow_late_submit?: number | boolean;
    }>(
      "SELECT deadline_at, allow_late_submit FROM opc_assignments WHERE id = ?",
      [assignment_id],
    );

    if (assignment) {
      const deadlineCheck = checkSubmissionDeadline(assignment);
      if (!deadlineCheck.allowed) {
        return NextResponse.json({ error: "已超过截止时间" }, { status: 403 });
      }
      isLate = deadlineCheck.isLate ? 1 : 0;
    }
  }

  await dbRun(
    "INSERT INTO opc_homework_records (student_id, homework_link, assignment_id, is_late, attachments) VALUES (?, ?, ?, ?, ?)",
    [
      student_id,
      textContent,
      assignment_id || null,
      isLate,
      serializeAttachments(attachmentList),
    ],
  );

  const homeworkId = await dbLastInsertId();
  waitUntil(
    enqueueHomeworkProcessing(homeworkId).catch((err) =>
      console.error("[OPC] Agent enqueue failed:", err),
    ),
  );

  return NextResponse.json({ success: true, is_late: isLate === 1 });
}

export async function getHomeworkById(id: string, role?: string | null) {
  const homework = await dbOne<Record<string, unknown>>(
    `
    SELECT h.*, a.title as assignment_title, a.deadline_at as assignment_deadline
    FROM opc_homework_records h
    LEFT JOIN opc_assignments a ON h.assignment_id = a.id
    WHERE h.id = ?
  `,
    [id],
  );

  if (!homework) {
    return NextResponse.json({ error: "作业不存在" }, { status: 404 });
  }

  const attachments = parseAttachments(homework.attachments);
  const status = homework.status as string;

  let feedback = await dbOne<Record<string, unknown>>(
    "SELECT * FROM opc_ai_feedbacks WHERE homework_id = ? ORDER BY generation_time DESC",
    [id],
  );

  if (role === "student" && status !== "COMPLETED") {
    feedback = undefined;
  }

  return NextResponse.json({
    homework: { ...homework, attachments },
    feedback: feedback ?? null,
  });
}

export async function updateHomeworkFeedback(
  id: string,
  body: { instructor_notes?: string },
) {
  const { instructor_notes } = body;
  if (instructor_notes === undefined) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }
  const feedback = await dbOne<{ id: number }>(
    "SELECT id FROM opc_ai_feedbacks WHERE homework_id = ? ORDER BY generation_time DESC LIMIT 1",
    [id],
  );

  if (!feedback) {
    return NextResponse.json(
      { error: "暂无 AI 反馈，无法保存批注" },
      { status: 404 },
    );
  }

  await dbRun("UPDATE opc_ai_feedbacks SET instructor_notes = ? WHERE id = ?", [
    instructor_notes,
    feedback.id,
  ]);

  return NextResponse.json({ success: true });
}

export async function getHomeworksByStudent(studentId: string) {
  const homeworks = await dbAll(
    `
    SELECT h.*, a.title as assignment_title
    FROM opc_homework_records h
    LEFT JOIN opc_assignments a ON h.assignment_id = a.id
    WHERE h.student_id = ?
    ORDER BY h.submission_time DESC
  `,
    [studentId],
  );
  return NextResponse.json(homeworks);
}

async function insertReviewEvent(
  instructorId: string | undefined,
  homeworkId: string,
  action: "publish" | "retrigger",
) {
  if (!instructorId) return;
  await dbRun(
    "INSERT INTO opc_review_events (instructor_id, homework_id, action) VALUES (?, ?, ?)",
    [instructorId, homeworkId, action],
  );
}

function getCurrentWeekRange() {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1, locale: zhCN });
  const end = endOfWeek(now, { weekStartsOn: 1, locale: zhCN });
  return { start, end };
}

function parseDimensionScores(raw: unknown): Record<string, number> | null {
  if (!raw || typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

export async function publishHomework(
  id: string,
  body: { instructor_id?: string } = {},
) {
  const { instructor_id } = body;
  const existing = await dbOne<{ id: number }>(
    "SELECT id FROM opc_homework_records WHERE id = ?",
    [id],
  );
  if (!existing) {
    return NextResponse.json({ error: "作业不存在" }, { status: 404 });
  }

  await dbRun(
    `UPDATE opc_homework_records
     SET status = ?, published_at = CURRENT_TIMESTAMP, reviewed_by = ?
     WHERE id = ?`,
    ["COMPLETED", instructor_id ?? null, id],
  );

  await insertReviewEvent(instructor_id, id, "publish");
  return NextResponse.json({ success: true });
}

export async function updateHomework(
  id: string,
  body: { content?: string; attachments?: HomeworkAttachment[] },
) {
  const { content, attachments } = body;
  const textContent = content?.trim() ?? "";
  const attachmentList = attachments;

  if (!textContent && (!attachmentList || attachmentList.length === 0)) {
    return NextResponse.json(
      { error: "请填写文本内容或上传至少一个附件" },
      { status: 400 },
    );
  }

  const existing = await dbOne<{
    homework_link: string;
    attachments?: string;
  }>(
    "SELECT homework_link, attachments FROM opc_homework_records WHERE id = ?",
    [id],
  );

  if (!existing) {
    return NextResponse.json({ error: "作业不存在" }, { status: 404 });
  }

  const finalContent = textContent || existing.homework_link;
  const finalAttachments =
    attachmentList !== undefined
      ? serializeAttachments(attachmentList)
      : (existing.attachments ?? "[]");

  await dbRun(
    "UPDATE opc_homework_records SET homework_link = ?, attachments = ?, status = 'MODIFIED' WHERE id = ?",
    [finalContent, finalAttachments, id],
  );
  return NextResponse.json({ success: true });
}

export async function retriggerHomework(
  id: string,
  body: { instructor_id?: string } = {},
) {
  const { instructor_id } = body;
  const existing = await dbOne<{ id: number }>(
    "SELECT id FROM opc_homework_records WHERE id = ?",
    [id],
  );
  if (!existing) {
    return NextResponse.json({ error: "作业不存在" }, { status: 404 });
  }

  await dbRun(
    "UPDATE opc_homework_records SET status = 'WAITING_REVIEW' WHERE id = ?",
    [id],
  );

  await insertReviewEvent(instructor_id, id, "retrigger");

  const homeworkId = Number(id);
  waitUntil(
    enqueueHomeworkProcessing(homeworkId).catch((err) =>
      console.error("[OPC] Agent retrigger failed:", err),
    ),
  );

  return NextResponse.json({ success: true });
}

export async function getStudentGrowth(studentId: string) {
  const student = await dbOne<{ student_id: string }>(
    "SELECT student_id FROM opc_students WHERE student_id = ?",
    [studentId],
  );
  if (!student) {
    return NextResponse.json({ error: "学员不存在" }, { status: 404 });
  }

  const rows = await dbAll<{
    id: number;
    status: string;
    submission_time: string;
    published_at: string | null;
    assignment_title: string | null;
    overall_score: number | null;
    dimension_scores: string | null;
    generation_time: string | null;
  }>(
    `
    SELECT h.id, h.status, h.submission_time, h.published_at,
           a.title as assignment_title,
           f.overall_score, f.dimension_scores, f.generation_time
    FROM opc_homework_records h
    LEFT JOIN opc_assignments a ON h.assignment_id = a.id
    LEFT JOIN opc_ai_feedbacks f ON f.id = (
      SELECT id FROM opc_ai_feedbacks
      WHERE homework_id = h.id
      ORDER BY generation_time DESC LIMIT 1
    )
    WHERE h.student_id = ?
    ORDER BY h.submission_time DESC
  `,
    [studentId],
  );

  const history = rows.map((r) => ({
    id: r.id,
    assignment_title: r.assignment_title || "未分类作业",
    status: r.status,
    submission_time: r.submission_time,
    published_at: r.published_at,
    score: r.status === "COMPLETED" ? (r.overall_score ?? null) : null,
  }));

  const scoreTrend = rows
    .filter((r) => r.status === "COMPLETED" && r.overall_score != null)
    .map((r) => ({
      date: r.published_at || r.submission_time,
      score: r.overall_score as number,
      assignmentTitle: r.assignment_title || "未分类作业",
    }))
    .sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

  const completedWithDims = rows
    .filter((r) => r.status === "COMPLETED" && r.dimension_scores)
    .sort(
      (a, b) =>
        new Date(b.published_at || b.submission_time).getTime() -
        new Date(a.published_at || a.submission_time).getTime(),
    )
    .slice(0, 5);

  const radarSums: Record<string, number> = {};
  const radarCounts: Record<string, number> = {};
  for (const dim of GROWTH_DIMENSIONS) {
    radarSums[dim] = 0;
    radarCounts[dim] = 0;
  }

  for (const r of completedWithDims) {
    const dims = parseDimensionScores(r.dimension_scores);
    if (!dims) continue;
    for (const dim of GROWTH_DIMENSIONS) {
      if (dims[dim] != null) {
        radarSums[dim] += dims[dim];
        radarCounts[dim] += 1;
      }
    }
  }

  const radar = GROWTH_DIMENSIONS.map((dimension) => ({
    dimension,
    score:
      radarCounts[dimension] > 0
        ? Math.round(radarSums[dimension] / radarCounts[dimension])
        : 0,
  }));

  const sortedRadar = [...radar].sort((a, b) => a.score - b.score);
  const weakest = sortedRadar.filter((d) => d.score > 0).slice(0, 2);
  const suggestions =
    weakest.length > 0
      ? weakest.map(
          (d) =>
            SUGGESTION_TEMPLATES[d.dimension] ||
            `建议加强「${d.dimension}」相关练习与复盘。`,
        )
      : ["完成更多作业并等待导师发布后，系统将自动生成能力提升建议。"];

  return NextResponse.json({
    history,
    scoreTrend,
    radar,
    suggestions,
  });
}

export async function getInstructorWorkload(instructorId: string) {
  const { start, end } = getCurrentWeekRange();
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const publishRow = await dbOne<{ c: number }>(
    `SELECT COUNT(*) as c FROM opc_review_events
       WHERE instructor_id = ? AND action = 'publish'
       AND created_at >= ? AND created_at <= ?`,
    [instructorId, startIso, endIso],
  );

  const retriggerRow = await dbOne<{ c: number }>(
    `SELECT COUNT(*) as c FROM opc_review_events
       WHERE instructor_id = ? AND action = 'retrigger'
       AND created_at >= ? AND created_at <= ?`,
    [instructorId, startIso, endIso],
  );

  const weeklyReviewedCount = publishRow?.c ?? 0;
  const retriggerCount = retriggerRow?.c ?? 0;
  const denominator = weeklyReviewedCount + retriggerCount;
  const reReviewRatio =
    denominator > 0
      ? Math.round((retriggerCount / denominator) * 1000) / 1000
      : 0;

  const avgRow = await dbOne<{ avg_minutes: number | null }>(
    `SELECT AVG(
         (julianday(published_at) - julianday(pending_audit_at)) * 24 * 60
       ) as avg_minutes
       FROM opc_homework_records
       WHERE reviewed_by = ?
         AND published_at IS NOT NULL
         AND pending_audit_at IS NOT NULL
         AND published_at >= ? AND published_at <= ?`,
    [instructorId, startIso, endIso],
  );

  const avgReviewDurationMinutes =
    avgRow?.avg_minutes != null
      ? Math.round(avgRow.avg_minutes * 10) / 10
      : 0;

  const multiRoundRow = await dbOne<{ multi_count: number }>(
    `SELECT COUNT(DISTINCT homework_id) as multi_count
       FROM (
         SELECT homework_id, COUNT(*) as cnt
         FROM opc_ai_feedbacks
         GROUP BY homework_id
         HAVING cnt > 1
       )`,
  );

  const totalPublishedRow = await dbOne<{ c: number }>(
    `SELECT COUNT(*) as c FROM opc_homework_records WHERE status = 'COMPLETED'`,
  );

  const totalPublished = totalPublishedRow?.c ?? 0;
  const aiMultiRoundRatio =
    totalPublished > 0
      ? Math.round(((multiRoundRow?.multi_count ?? 0) / totalPublished) * 1000) /
        1000
      : 0;

  return NextResponse.json({
    weeklyReviewedCount,
    avgReviewDurationMinutes,
    reReviewRatio,
    aiMultiRoundRatio,
    weekRange: { start: startIso, end: endIso },
  });
}

export async function getAgentStatus() {
  const logs = await dbAll(
    "SELECT * FROM sys_agent_logs ORDER BY created_at DESC LIMIT 50",
  );
  const activeCount = await getActiveAgentsCount();
  const stats = await dbOne<{ total: number; success: number }>(
    "SELECT COUNT(*) as total, SUM(CASE WHEN result_state='SUCCESS' THEN 1 ELSE 0 END) as success FROM sys_agent_logs",
  );
  return NextResponse.json({ activeCount, logs, stats });
}

export async function listCohorts() {
  const cohorts = await dbAll(
    "SELECT * FROM opc_cohorts ORDER BY created_at DESC",
  );
  return NextResponse.json(cohorts);
}

export async function createCohort(body: { name?: string }) {
  const { name } = body;
  if (!name) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }
  try {
    await dbRun("INSERT INTO opc_cohorts (name) VALUES (?)", [name]);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (isUniqueConstraintError(err)) {
      return NextResponse.json({ error: "班级已存在" }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function updateCohort(id: string, body: { name?: string }) {
  const { name } = body;
  if (!name) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }
  try {
    await dbRun("UPDATE opc_cohorts SET name = ? WHERE id = ?", [name, id]);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (isUniqueConstraintError(err)) {
      return NextResponse.json({ error: "班级名称冲突" }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function deleteCohort(id: string) {
  await dbRun("DELETE FROM opc_cohorts WHERE id = ?", [id]);
  return NextResponse.json({ success: true });
}

export async function listStudents() {
  const students = await dbAll(
    `
    SELECT s.*, COALESCE(h.hw_count, 0) as hw_count 
    FROM opc_students s
    LEFT JOIN (
      SELECT student_id, COUNT(*) as hw_count 
      FROM opc_homework_records 
      GROUP BY student_id
    ) h ON s.student_id = h.student_id
    ORDER BY s.created_at DESC
  `,
  );
  return NextResponse.json(students);
}

export async function createStudent(body: {
  student_id?: string;
  name?: string;
  cohort_name?: string;
  password?: string;
}) {
  const { student_id, name, cohort_name, password } = body;
  if (!student_id || !name || !cohort_name) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }
  try {
    await dbRun(
      "INSERT INTO opc_students (student_id, name, cohort_name, password) VALUES (?, ?, ?, ?)",
      [student_id, name, cohort_name, password || "123456"],
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (isPrimaryKeyConstraintError(err)) {
      return NextResponse.json({ error: "学员ID已存在" }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function loginStudent(body: {
  student_id?: string;
  password?: string;
}) {
  const { student_id, password } = body;
  if (!student_id || !password) {
    return NextResponse.json(
      { error: "请输入学号和密码" },
      { status: 400 },
    );
  }
  const student = await dbOne(
    "SELECT * FROM opc_students WHERE student_id = ? AND password = ?",
    [student_id, password],
  );
  if (!student) {
    return NextResponse.json({ error: "学号或密码错误" }, { status: 401 });
  }
  return NextResponse.json({ success: true, student });
}

export async function getStudent(studentId: string) {
  const student = await dbOne(
    "SELECT * FROM opc_students WHERE student_id = ?",
    [studentId],
  );
  return NextResponse.json(student || null);
}

export async function updateStudent(
  studentId: string,
  body: {
    name?: string;
    cohort_name?: string;
    new_student_id?: string;
    password?: string;
  },
) {
  const { name, cohort_name, new_student_id, password } = body;
  if (!name || !cohort_name) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }
  try {
    if (new_student_id && new_student_id !== studentId) {
      await dbRun(
        "UPDATE opc_students SET student_id = ?, name = ?, cohort_name = ?, password = ? WHERE student_id = ?",
        [
          new_student_id,
          name,
          cohort_name,
          password || "123456",
          studentId,
        ],
      );
      await dbRun(
        "UPDATE opc_homework_records SET student_id = ? WHERE student_id = ?",
        [new_student_id, studentId],
      );
    } else {
      await dbRun(
        "UPDATE opc_students SET name = ?, cohort_name = ?, password = ? WHERE student_id = ?",
        [name, cohort_name, password || "123456", studentId],
      );
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function deleteStudent(studentId: string) {
  await dbRun("DELETE FROM opc_students WHERE student_id = ?", [studentId]);
  return NextResponse.json({ success: true });
}

export async function getStudentRanking(studentId: string) {
  const student = await dbOne<{ cohort_name: string }>(
    "SELECT cohort_name FROM opc_students WHERE student_id = ?",
    [studentId],
  );
  if (!student) {
    return NextResponse.json({ rankings: [] });
  }

  const rankings = await dbAll(
    `
    SELECT s.student_id, s.name, COUNT(h.id) as score
    FROM opc_students s
    LEFT JOIN opc_homework_records h ON s.student_id = h.student_id AND h.status = 'COMPLETED'
    WHERE s.cohort_name = ?
    GROUP BY s.student_id
    ORDER BY score DESC, s.created_at ASC
    LIMIT 10
  `,
    [student.cohort_name],
  );

  return NextResponse.json({
    cohort_name: student.cohort_name,
    rankings,
  });
}

export async function listKnowledgeBase() {
  const items = await dbAll(
    "SELECT * FROM opc_knowledge_base ORDER BY created_at DESC",
  );
  return NextResponse.json(items);
}

export async function createKnowledgeBase(body: {
  title?: string;
  content?: string;
  type?: string;
}) {
  const { title, content, type } = body;
  if (!title || !content || !type) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }
  await dbRun(
    "INSERT INTO opc_knowledge_base (title, content, type) VALUES (?, ?, ?)",
    [title, content, type],
  );
  return NextResponse.json({ success: true });
}

export async function deleteKnowledgeBase(id: string) {
  await dbRun("DELETE FROM opc_knowledge_base WHERE id = ?", [id]);
  return NextResponse.json({ success: true });
}
