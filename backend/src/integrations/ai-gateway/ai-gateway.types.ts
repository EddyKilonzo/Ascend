/** Shared TypeScript types for all ML service contracts. */

export interface AiFactor {
  name: string;
  impact: string;
  direction: 'positive' | 'negative' | 'neutral';
}

export interface AiEnvelope {
  prediction: number;
  confidence: number;
  reasoning: string;
  factors: AiFactor[];
  recommendations: string[];
}

// ── AI Engine (port 5000) ─────────────────────────────────────────────────────

export interface ProductivityScoreRequest {
  user_id: string;
  period_days: number;
  habits: Array<{
    habit_id: string;
    frequency: string;
    difficulty: number;
    completions: Array<{ date: string; completed: boolean }>;
    current_streak: number;
  }>;
  focus_sessions: Array<{ date: string; minutes: number; mode: string }>;
  tasks_completed: number;
  tasks_total: number;
  social_usage: Array<{ platform: string; minutes: number; date: string }>;
}

export interface ProductivityScoreResponse {
  user_id: string;
  score: number;
  confidence: number;
  grade: string;
  breakdown: {
    habit_score: number;
    focus_score: number;
    task_score: number;
    social_penalty: number;
    consistency_score: number;
  };
  insights: string[];
  period_days: number;
  computed_at: string;
}

export interface HabitPredictionRequest {
  user_id: string;
  habit_id: string;
  difficulty: number;
  habit_age_days: number;
  current_streak: number;
  history: Array<{ date: string; completed: boolean; completion_time?: string }>;
  target_time?: string;
  avg_focus_minutes_7d?: number;
  productivity_score_yesterday?: number;
}

export interface HabitPredictionResponse {
  user_id: string;
  habit_id: string;
  completion_probability: number;
  confidence: number;
  best_time_window: string | null;
  risk_factors: string[];
  model_used: string;
}

export interface GoalForecastRequest {
  user_id: string;
  goal_id: string;
  current_progress_pct: number;
  daily_progress_history: number[];
  target_date?: string;
  difficulty: number;
}

export interface GoalForecastResponse {
  user_id: string;
  goal_id: string;
  completion_probability: number;
  confidence: number;
  eta_days: number | null;
  on_track: boolean;
  projected_completion_date: string | null;
  velocity: number;
  insights: string[];
}

export interface BurnoutDetectionRequest {
  user_id: string;
  period_days: number;
  daily_metrics: Array<{
    date: string;
    productivity_score: number;
    focus_minutes: number;
    habit_completion_rate: number;
    social_usage_minutes: number;
  }>;
  current_streak: number;
  overdue_task_rate: number;
}

export interface BurnoutDetectionResponse {
  user_id: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_score: number;
  confidence: number;
  signals: Array<{ signal_type: string; severity: string; description: string }>;
  recommendations: string[];
  assessed_at: string;
}

export interface AntiCheatRequest {
  user_id: string;
  period_hours: number;
  xp_events: Array<{ timestamp: string; xp_amount: number; source: string }>;
  habit_completions: Array<{
    habit_id: string;
    completed: boolean;
    completion_time?: string;
    date: string;
  }>;
  recent_actions: Array<{ action_type: string; timestamp: string }>;
}

export interface AntiCheatResponse {
  user_id: string;
  is_suspicious: boolean;
  overall_risk: string;
  confidence: number;
  detections: Array<{ flag: string; confidence: number; evidence: string; severity: string }>;
  xp_adjustment_recommended: boolean;
  recommended_xp_reduction_pct: number;
  assessed_at: string;
}

export interface RecommendationRequest {
  user_id: string;
  productivity_score: number;
  habit_completion_rate_7d: number;
  focus_score_7d: number;
  social_penalty_7d: number;
  current_streak: number;
  overdue_task_rate: number;
  habits: Array<{ id: string; name: string; completion_rate: number; difficulty: number }>;
}

export interface RecommendationResponse {
  user_id: string;
  recommendations: Array<{
    type: string;
    priority: string;
    title: string;
    description: string;
    action: string;
    estimated_impact: string;
  }>;
  focus_area: string;
  generated_at: string;
}

// ── Maya Service (port 5002) ──────────────────────────────────────────────────

export type CoachingModule =
  | 'PRODUCTIVITY' | 'ACCOUNTABILITY' | 'HABIT' | 'GOAL'
  | 'FOCUS' | 'BURNOUT' | 'SCHEDULE' | 'WEEKLY_REVIEW'
  | 'MONTHLY_REVIEW' | 'ACHIEVEMENT';

export interface MayaRequest {
  user_context: {
    user_id: string;
    habits: Array<{
      id: string;
      name: string;
      frequency: string;
      current_streak: number;
      completion_rate_7d: number;
      completion_rate_30d: number;
      difficulty: number;
      target_time?: string;
    }>;
    goals: Array<{
      id: string;
      title: string;
      progress_pct: number;
      target_date?: string;
      status: string;
    }>;
    focus: {
      total_minutes_7d: number;
      sessions_7d: number;
      avg_session_minutes: number;
    };
    productivity_score: number;
    burnout_risk: { risk_level: string; risk_score: number };
    xp: { total: number; level: number; weekly_xp: number };
    social_usage_minutes_7d: number;
    overdue_tasks: number;
    achievements_count: number;
  };
  coaching_module: CoachingModule;
  user_message?: string;
}

export interface MayaResponse {
  request_id: string;
  user_id: string;
  coaching_module: string;
  prediction: number | null;
  confidence: number | null;
  factors: Array<{ name: string; impact: string; direction: string; description: string }>;
  explanation: string;
  recommendations: string[];
  urgency: string;
  latency_ms: number;
  cached: boolean;
}

// ── OCR Service (port 5004) ───────────────────────────────────────────────────

export interface OcrResponse {
  request_id: string;
  success: boolean;
  pipeline: string;
  hint: string;
  ocr_result?: Record<string, unknown>;
  structured?: Record<string, unknown>;
  intelligence?: {
    ocr_intent: string;
    extractable_items: unknown[];
    recommended_action: string;
    ready_for_ingestion: boolean;
  };
  error?: string;
  latency_ms: number;
}

// ── AI Platform (port 5001) ───────────────────────────────────────────────────

export interface MlEventPayload {
  event_type: string;
  user_id: string;
  payload: Record<string, unknown>;
  timestamp: string;
}
