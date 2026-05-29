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
  id: number;
  content: string;
  is_correct: boolean | null;
}

export interface CurrentQuestion {
  round_question_id: number;
  order_number: number;
  content: string;
  status: "open" | "closed";
  opened_at: string | null;
  time_limit_seconds: number;
  answers: GameAnswer[];
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
