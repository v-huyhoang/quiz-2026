import { api } from "./api";
import type { ApiResponse } from "../type/api";

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Public endpoints ──────────────────────────────────────────────────────────

export const getPublicGameState = (gameId: number | string) =>
  api.get<ApiResponse<GameState>>(`/games/${gameId}/state`);

export const getLeaderboard = (gameId: number | string) =>
  api.get<ApiResponse<LeaderboardEntry[]>>(`/games/${gameId}/leaderboard`);

export const submitAnswer = (roundQuestionId: number, answerId: number) =>
  api.post<ApiResponse<null>>("/games/submit", {
    round_question_id: roundQuestionId,
    answer_id: answerId,
  });

// ── Admin endpoints ───────────────────────────────────────────────────────────

export const getAdminGameState = (id: number) =>
  api.get<ApiResponse<GameState>>(`/admin/games/${id}/state`);

export const startGame = (id: number) =>
  api.post<ApiResponse<GameState>>(`/admin/games/${id}/start`);

export const startRound = (id: number) =>
  api.post<ApiResponse<GameState>>(`/admin/games/${id}/start-round`);

export const openQuestion = (id: number) =>
  api.post<ApiResponse<GameState>>(`/admin/games/${id}/open-question`);

export const closeQuestion = (id: number) =>
  api.post<ApiResponse<GameState>>(`/admin/games/${id}/close-question`);

export const finishRound = (id: number) =>
  api.post<ApiResponse<GameState>>(`/admin/games/${id}/finish-round`);

export const finishGame = (id: number) =>
  api.post<ApiResponse<GameState>>(`/admin/games/${id}/finish`);
