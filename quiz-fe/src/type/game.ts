export interface GameTeam {
  id: number;
  name: string;
}

export interface TeamSubmission {
  team_id: number;
  team_name: string;
  submitted: boolean;
  is_correct: boolean | null;
}

export interface GameAnswer {
  id: number | null;
  content: string;
  is_correct: boolean | null;
}

export interface MySubmission {
  answer_id: number | null;
  submitted_data: { answer_id?: number; text?: string } | null;
  is_correct: boolean;
  response_time_ms: number;
}

export interface CurrentQuestion {
  round_question_id: number;
  order_number: number;
  type: "single_choice" | "image_input";
  content: string | null;
  image_url: string | null;
  status: "open" | "closed";
  opened_at: string | null;
  time_limit_seconds: number;
  answers: GameAnswer[];
  my_submission?: MySubmission | null;
  team_submissions?: TeamSubmission[];
}

export interface CurrentRound {
  round_number: number;
  status: string;
  questions_done: number;
  total_questions: number;
  current_question: CurrentQuestion | null;
}

export interface GameState {
  status: "pending" | "active" | "finished";
  name: string;
  access_code: string;
  rounds_total: number;
  questions_per_round: number;
  max_teams: number;
  teams: GameTeam[];
  current_round: CurrentRound | null;
}

export interface LeaderboardEntry {
  rank: number;
  team_id: number;
  team_name: string;
  correct_count: number;
  total_time_seconds: number;
}
