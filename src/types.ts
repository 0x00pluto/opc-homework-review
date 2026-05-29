export interface Student {
  student_id: string;
  name: string;
  cohort_name: string;
  created_at: string;
  hw_count?: number;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  cohort_name?: string;
  created_at: string;
}

export interface HomeworkRecord {
  id: number;
  student_id: string;
  assignment_id?: number;
  homework_link: string;
  status:
    | "WAITING_REVIEW"
    | "PROCESSING"
    | "PENDING_AUDIT"
    | "COMPLETED"
    | "MODIFIED";
  submission_time: string;
  assignment_title?: string;
}

export interface KnowledgeBase {
  id: number;
  title: string;
  content: string;
  type: "manual" | "standard_answer";
  created_at: string;
}

export interface AiFeedback {
  id: number;
  homework_id: number;
  feedback_content: string;
  is_low_quality: boolean;
  generation_time: string;
}

export interface AgentLog {
  log_id: number;
  agent_thread_id: number;
  target_homework_id: number;
  execution_time: number;
  result_state: string;
  created_at: string;
}
