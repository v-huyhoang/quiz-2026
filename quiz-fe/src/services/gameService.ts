import { api } from "./api";
import type { ApiResponse } from "../type/api";
import type { GameState, LeaderboardEntry } from "../type/game";

// Re-export all game types from the canonical location
export type {
  GameTeam,
  TeamSubmission,
  GameAnswer,
  CurrentQuestion,
  CurrentRound,
  GameState,
  LeaderboardEntry,
} from "../type/game";

export interface RoundResultEntry {
  rank: number;
  team_id: number;
  team_name: string;
  correct_count: number;
  total_time_seconds: number;
}

export interface RoundResult {
  round_number: number;
  top_teams: RoundResultEntry[];
}

// ── Public endpoints ──────────────────────────────────────────────────────────

export const getPublicGameState = (gameId: number | string) =>
  api.get<ApiResponse<GameState>>(`/games/${gameId}/state`);

export const getPlayerGameState = (gameId: number | string) =>
  api.get<ApiResponse<GameState>>(`/games/${gameId}/player-state`);

export const getLeaderboard = (gameId: number | string) =>
  api.get<ApiResponse<LeaderboardEntry[]>>(`/games/${gameId}/leaderboard`);

export const submitAnswer = (payload: {
  round_question_id: number;
  answer_id?: number;
  text_answer?: string;
  response_time_ms?: number;
}) => api.post<ApiResponse<{ is_correct: boolean }>>("/games/submit", payload);

// ── Admin endpoints ───────────────────────────────────────────────────────────

export const getAdminGameState = (id: number) =>
  api.get<ApiResponse<GameState>>(`/admin/games/${id}/state`);

export const getRoundResults = (id: number | string) =>
  api.get<ApiResponse<RoundResult[]>>(`/admin/games/${id}/round-results`);

export const getPublicRoundResults = (id: number | string) =>
  api.get<ApiResponse<RoundResult[]>>(`/games/${id}/round-results`);

export const revealScreen = (id: number) =>
  api.post<ApiResponse<null>>(`/admin/games/${id}/reveal`);

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
