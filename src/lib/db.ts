import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

let db: ReturnType<typeof Database> | null = null;

function getDbPath() {
  const configured = process.env.DATABASE_PATH;
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.join(/* turbopackIgnore: true */ process.cwd(), configured);
  }
  return path.join(process.cwd(), "db_data", "opc_homework.db");
}

export function initDb() {
  if (db) return db;

  const dbPath = getDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS opc_cohorts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS opc_students (
      student_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cohort_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS opc_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS opc_homework_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      homework_link TEXT NOT NULL,
      status TEXT DEFAULT 'WAITING_REVIEW',
      submission_time DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    db.exec(
      `ALTER TABLE opc_homework_records ADD COLUMN assignment_id INTEGER`,
    );
  } catch {
    // column exists
  }

  try {
    db.exec(`ALTER TABLE opc_students ADD COLUMN password TEXT`);
  } catch {
    // column exists
  }

  try {
    db.exec(
      `ALTER TABLE opc_assignments ADD COLUMN cohort_name TEXT DEFAULT '全服'`,
    );
  } catch {
    // column exists
  }

  try {
    db.exec(`ALTER TABLE opc_assignments ADD COLUMN deadline_at DATETIME`);
  } catch {
    // column exists
  }

  try {
    db.exec(
      `ALTER TABLE opc_assignments ADD COLUMN allow_late_submit INTEGER DEFAULT 1`,
    );
  } catch {
    // column exists
  }

  try {
    db.exec(
      `ALTER TABLE opc_homework_records ADD COLUMN is_late INTEGER DEFAULT 0`,
    );
  } catch {
    // column exists
  }

  try {
    db.exec(
      `ALTER TABLE opc_homework_records ADD COLUMN attachments TEXT DEFAULT '[]'`,
    );
  } catch {
    // column exists
  }

  try {
    db.exec(
      `ALTER TABLE opc_ai_feedbacks ADD COLUMN instructor_notes TEXT DEFAULT ''`,
    );
  } catch {
    // column exists
  }

  try {
    db.exec(`ALTER TABLE opc_ai_feedbacks ADD COLUMN overall_score INTEGER`);
  } catch {
    // column exists
  }

  try {
    db.exec(
      `ALTER TABLE opc_ai_feedbacks ADD COLUMN dimension_scores TEXT DEFAULT '{}'`,
    );
  } catch {
    // column exists
  }

  try {
    db.exec(
      `ALTER TABLE opc_homework_records ADD COLUMN pending_audit_at DATETIME`,
    );
  } catch {
    // column exists
  }

  try {
    db.exec(
      `ALTER TABLE opc_homework_records ADD COLUMN published_at DATETIME`,
    );
  } catch {
    // column exists
  }

  try {
    db.exec(
      `ALTER TABLE opc_homework_records ADD COLUMN reviewed_by TEXT`,
    );
  } catch {
    // column exists
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS opc_knowledge_base (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const count = db
    .prepare("SELECT COUNT(*) as c FROM opc_assignments")
    .get() as { c: number };
  if (count.c === 0) {
    db.prepare(
      "INSERT INTO opc_assignments (title, description) VALUES (?, ?)",
    ).run(
      "Day 2: 职业转型自述",
      "讲述自己为何想成为超级个体（不少于200字）。",
    );
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS opc_ai_feedbacks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      homework_id INTEGER NOT NULL,
      feedback_content TEXT NOT NULL,
      is_low_quality BOOLEAN DEFAULT 0,
      generation_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(homework_id) REFERENCES opc_homework_records(id)
    );

    CREATE TABLE IF NOT EXISTS sys_agent_logs (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_thread_id INTEGER,
      target_homework_id INTEGER,
      execution_time INTEGER,
      result_state TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS opc_review_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instructor_id TEXT NOT NULL,
      homework_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(homework_id) REFERENCES opc_homework_records(id)
    );
  `);

  return db;
}

function ensureAgentsStarted() {
  if (globalThis.__opcAgentStarted) return;
  import("./agents")
    .then(({ startPollingAgents }) => {
      globalThis.__opcAgentStarted = true;
      return startPollingAgents();
    })
    .catch((err) => {
      console.error("[OPC] Agent 启动失败:", err);
    });
}

export function getDb() {
  if (!db) {
    initDb();
    ensureAgentsStarted();
  }
  if (!db) {
    throw new Error("Database failed to initialize");
  }
  return db;
}
