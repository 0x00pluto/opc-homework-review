export interface Student {
  student_id: string;
  name: string;
  cohort_name: string;
  created_at: string;
  hw_count?: number;
}

export interface HomeworkAttachment {
  id: string;
  original_name: string;
  stored_name: string;
  mime_type: string;
  size: number;
  url?: string;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  cohort_name?: string;
  deadline_at?: string | null;
  allow_late_submit?: number | boolean;
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
  is_late?: number | boolean;
  attachments?: HomeworkAttachment[] | string;
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
  instructor_notes?: string;
  overall_score?: number | null;
  dimension_scores?: string | Record<string, number> | null;
  generation_time: string;
}

export interface GrowthHistoryItem {
  id: number;
  assignment_title: string;
  status: HomeworkRecord["status"];
  submission_time: string;
  published_at: string | null;
  score: number | null;
}

export interface GrowthScoreTrendPoint {
  date: string;
  score: number;
  assignmentTitle: string;
}

export interface GrowthRadarPoint {
  dimension: string;
  score: number;
}

export interface GrowthStatsResponse {
  history: GrowthHistoryItem[];
  scoreTrend: GrowthScoreTrendPoint[];
  radar: GrowthRadarPoint[];
  suggestions: string[];
}

export interface WorkloadStatsResponse {
  weeklyReviewedCount: number;
  avgReviewDurationMinutes: number;
  reReviewRatio: number;
  aiMultiRoundRatio: number;
  weekRange: { start: string; end: string };
}

export interface AgentLog {
  log_id: number;
  agent_thread_id: number;
  target_homework_id: number;
  execution_time: number;
  result_state: string;
  created_at: string;
}
