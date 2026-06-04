-- initial_schema: OPC 业务表基线（Turso / libSQL）
-- 后续结构变更请新建 migration，勿改本文件（已发布环境视为不可变历史）

CREATE TABLE IF NOT EXISTS opc_cohorts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opc_students (
  student_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cohort_name TEXT NOT NULL,
  password TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opc_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  cohort_name TEXT DEFAULT '全员',
  deadline_at DATETIME,
  allow_late_submit INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opc_homework_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  homework_link TEXT NOT NULL,
  status TEXT DEFAULT 'WAITING_REVIEW',
  assignment_id INTEGER,
  is_late INTEGER DEFAULT 0,
  attachments TEXT DEFAULT '[]',
  pending_audit_at DATETIME,
  published_at DATETIME,
  reviewed_by TEXT,
  submission_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opc_knowledge_base (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opc_ai_feedbacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  homework_id INTEGER NOT NULL,
  feedback_content TEXT NOT NULL,
  is_low_quality BOOLEAN DEFAULT 0,
  instructor_notes TEXT DEFAULT '',
  overall_score INTEGER,
  dimension_scores TEXT DEFAULT '{}',
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

INSERT INTO opc_assignments (title, description)
SELECT 'Day 2: 职业转型自述', '讲述自己为何想成为超级个体（不少于200字）。'
WHERE NOT EXISTS (SELECT 1 FROM opc_assignments LIMIT 1);
