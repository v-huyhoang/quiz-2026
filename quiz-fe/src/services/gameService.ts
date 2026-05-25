import { api } from "./api";

export interface StartGamePayload {
  game_id: number;
}

export interface GameData {
  id: number;
  name: string;
  access_code: string;
  rounds: number;
  questions_per_round: number;
  question_mode: "random" | "manual";
  status: "pending" | "active" | "finished";
  join_url?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  code?: number;
}

/** Admin: start game */
export const startGame = (payload: StartGamePayload) =>
  api.post<ApiResponse<GameData>>("/admin/games/start", payload);

/** Admin: get active game */
export const getActiveGame = () =>
  api.get<ApiResponse<GameData>>("/admin/games/active");

/** Admin: get current question */
export const getCurrentQuestion = (gameId: number) =>
  api.get("/admin/games/current-question", { params: { game_id: gameId } });
