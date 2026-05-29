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
