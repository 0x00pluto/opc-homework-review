import { NextResponse } from "next/server";
import { getActiveAgentsCount } from "@/lib/agents";
import { getDb } from "@/lib/db";

export function getAssignments(cohort?: string | null) {
  const db = getDb();
  if (cohort) {
    return db
      .prepare(
        "SELECT * FROM opc_assignments WHERE cohort_name = ? OR cohort_name = '全员' OR cohort_name = '全服' ORDER BY created_at DESC",
      )
      .all(cohort);
  }
  return db
    .prepare("SELECT * FROM opc_assignments ORDER BY created_at DESC")
    .all();
}

export function createAssignment(body: {
  title?: string;
  description?: string;
  cohort_name?: string;
}) {
  const { title, description, cohort_name } = body;
  if (!title || !description) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }
  const db = getDb();
  db.prepare(
    "INSERT INTO opc_assignments (title, description, cohort_name) VALUES (?, ?, ?)",
  ).run(title, description, cohort_name || "全服");
  return NextResponse.json({ success: true });
}

export function listHomeworks() {
  const db = getDb();
  const homeworks = db
    .prepare(
      `
    SELECT h.*, a.title as assignment_title 
    FROM opc_homework_records h 
    LEFT JOIN opc_assignments a ON h.assignment_id = a.id 
    ORDER BY h.submission_time DESC
  `,
    )
    .all();
  return NextResponse.json(homeworks);
}

export function createHomework(body: {
  student_id?: string;
  content?: string;
  assignment_id?: number;
}) {
  const { student_id, content, assignment_id } = body;
  if (!student_id || !content) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }
  const db = getDb();
  db.prepare(
    "INSERT INTO opc_homework_records (student_id, homework_link, assignment_id) VALUES (?, ?, ?)",
  ).run(student_id, content, assignment_id || null);
  return NextResponse.json({ success: true });
}

export function getHomeworkById(id: string) {
  const db = getDb();
  const homework = db
    .prepare("SELECT * FROM opc_homework_records WHERE id = ?")
    .get(id);
  const feedback = db
    .prepare(
      "SELECT * FROM opc_ai_feedbacks WHERE homework_id = ? ORDER BY generation_time DESC",
    )
    .get(id);
  return NextResponse.json({ homework, feedback });
}

export function getHomeworksByStudent(studentId: string) {
  const db = getDb();
  const homeworks = db
    .prepare(
      `
    SELECT h.*, a.title as assignment_title
    FROM opc_homework_records h
    LEFT JOIN opc_assignments a ON h.assignment_id = a.id
    WHERE h.student_id = ?
    ORDER BY h.submission_time DESC
  `,
    )
    .all(studentId);
  return NextResponse.json(homeworks);
}

export function publishHomework(id: string) {
  const db = getDb();
  db.prepare("UPDATE opc_homework_records SET status = ? WHERE id = ?").run(
    "COMPLETED",
    id,
  );
  return NextResponse.json({ success: true });
}

export function updateHomework(id: string, body: { content?: string }) {
  const { content } = body;
  if (!content) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }
  const db = getDb();
  db.prepare(
    "UPDATE opc_homework_records SET homework_link = ?, status = 'MODIFIED' WHERE id = ?",
  ).run(content, id);
  return NextResponse.json({ success: true });
}

export function retriggerHomework(id: string) {
  const db = getDb();
  db.prepare(
    "UPDATE opc_homework_records SET status = 'WAITING_REVIEW' WHERE id = ?",
  ).run(id);
  return NextResponse.json({ success: true });
}

export async function getAgentStatus() {
  const db = getDb();
  const logs = db
    .prepare(
      "SELECT * FROM sys_agent_logs ORDER BY created_at DESC LIMIT 50",
    )
    .all();
  const activeCount = await getActiveAgentsCount();
  const stats = db
    .prepare(
      "SELECT COUNT(*) as total, SUM(CASE WHEN result_state='SUCCESS' THEN 1 ELSE 0 END) as success FROM sys_agent_logs",
    )
    .get();
  return NextResponse.json({ activeCount, logs, stats });
}

export function listCohorts() {
  const db = getDb();
  return NextResponse.json(
    db.prepare("SELECT * FROM opc_cohorts ORDER BY created_at DESC").all(),
  );
}

export function createCohort(body: { name?: string }) {
  const { name } = body;
  if (!name) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }
  const db = getDb();
  try {
    db.prepare("INSERT INTO opc_cohorts (name) VALUES (?)").run(name);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return NextResponse.json({ error: "班级已存在" }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export function updateCohort(id: string, body: { name?: string }) {
  const { name } = body;
  if (!name) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }
  const db = getDb();
  try {
    db.prepare("UPDATE opc_cohorts SET name = ? WHERE id = ?").run(name, id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return NextResponse.json({ error: "班级名称冲突" }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export function deleteCohort(id: string) {
  const db = getDb();
  db.prepare("DELETE FROM opc_cohorts WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}

export function listStudents() {
  const db = getDb();
  const students = db
    .prepare(
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
    )
    .all();
  return NextResponse.json(students);
}

export function createStudent(body: {
  student_id?: string;
  name?: string;
  cohort_name?: string;
  password?: string;
}) {
  const { student_id, name, cohort_name, password } = body;
  if (!student_id || !name || !cohort_name) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }
  const db = getDb();
  try {
    db.prepare(
      "INSERT INTO opc_students (student_id, name, cohort_name, password) VALUES (?, ?, ?, ?)",
    ).run(student_id, name, cohort_name, password || "123456");
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e.code === "SQLITE_CONSTRAINT_PRIMARYKEY") {
      return NextResponse.json({ error: "学员ID已存在" }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export function loginStudent(body: {
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
  const db = getDb();
  const student = db
    .prepare(
      "SELECT * FROM opc_students WHERE student_id = ? AND password = ?",
    )
    .get(student_id, password);
  if (!student) {
    return NextResponse.json({ error: "学号或密码错误" }, { status: 401 });
  }
  return NextResponse.json({ success: true, student });
}

export function getStudent(studentId: string) {
  const db = getDb();
  const student = db
    .prepare("SELECT * FROM opc_students WHERE student_id = ?")
    .get(studentId);
  return NextResponse.json(student || null);
}

export function updateStudent(
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
  const db = getDb();
  try {
    if (new_student_id && new_student_id !== studentId) {
      db.prepare(
        "UPDATE opc_students SET student_id = ?, name = ?, cohort_name = ?, password = ? WHERE student_id = ?",
      ).run(
        new_student_id,
        name,
        cohort_name,
        password || "123456",
        studentId,
      );
      db.prepare(
        "UPDATE opc_homework_records SET student_id = ? WHERE student_id = ?",
      ).run(new_student_id, studentId);
    } else {
      db.prepare(
        "UPDATE opc_students SET name = ?, cohort_name = ?, password = ? WHERE student_id = ?",
      ).run(name, cohort_name, password || "123456", studentId);
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const e = err as { message?: string };
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export function deleteStudent(studentId: string) {
  const db = getDb();
  db.prepare("DELETE FROM opc_students WHERE student_id = ?").run(studentId);
  return NextResponse.json({ success: true });
}

export function getStudentRanking(studentId: string) {
  const db = getDb();
  const student = db
    .prepare("SELECT cohort_name FROM opc_students WHERE student_id = ?")
    .get(studentId) as { cohort_name: string } | undefined;
  if (!student) {
    return NextResponse.json({ rankings: [] });
  }

  const rankings = db
    .prepare(
      `
    SELECT s.student_id, s.name, COUNT(h.id) as score
    FROM opc_students s
    LEFT JOIN opc_homework_records h ON s.student_id = h.student_id AND h.status = 'COMPLETED'
    WHERE s.cohort_name = ?
    GROUP BY s.student_id
    ORDER BY score DESC, s.created_at ASC
    LIMIT 10
  `,
    )
    .all(student.cohort_name);

  return NextResponse.json({
    cohort_name: student.cohort_name,
    rankings,
  });
}

export function listKnowledgeBase() {
  const db = getDb();
  return NextResponse.json(
    db
      .prepare("SELECT * FROM opc_knowledge_base ORDER BY created_at DESC")
      .all(),
  );
}

export function createKnowledgeBase(body: {
  title?: string;
  content?: string;
  type?: string;
}) {
  const { title, content, type } = body;
  if (!title || !content || !type) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }
  const db = getDb();
  db.prepare(
    "INSERT INTO opc_knowledge_base (title, content, type) VALUES (?, ?, ?)",
  ).run(title, content, type);
  return NextResponse.json({ success: true });
}

export function deleteKnowledgeBase(id: string) {
  const db = getDb();
  db.prepare("DELETE FROM opc_knowledge_base WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
