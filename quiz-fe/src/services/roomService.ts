import { api } from "./api";
import type { ApiResponse } from "../type/api";

export interface JoinRoomResponse {
  token: string;
  team_id: number;
  team_name: string;
  game_id: number;
  room: {
    id: number;
    name: string;
    access_code: string;
  };
}

export interface RoundQuestionAssignment {
  round_number: number;
  question_ids: number[];
}

export interface CreateRoomPayload {
  name: string;
  rounds: number;
  questions_per_round: number;
  access_code: string;
  question_mode: "random" | "manual";
  round_questions?: RoundQuestionAssignment[];
}

export interface CreateRoomResponse {
  id: number;
  name: string;
  access_code: string;
  rounds: number;
  questions_per_round: number;
  question_mode: "random" | "manual";
  status: "pending" | "active" | "finished";
}

/** Player: tham gia phòng bằng access code + tên team */
export const joinRoom = (code: string, teamName: string) =>
  api.post<ApiResponse<JoinRoomResponse>>(`/rooms/${code}/join`, { team_name: teamName });

/** Admin: tạo phòng mới */
export const createRoom = (payload: CreateRoomPayload) =>
  api.post<ApiResponse<CreateRoomResponse>>("/admin/rooms", payload);

/** Admin: get danh sách phòng (flat array) */
export const getRooms = () =>
  api.get<ApiResponse<CreateRoomResponse[]>>("/admin/rooms");

/** Admin: xóa phòng */
export const deleteRoom = (id: string) =>
  api.delete(`/admin/rooms/${id}`);

/** Admin: lấy chi tiết phòng */
export const getRoomDetail = async (id: string) => {
  const response = await api.get(`/admin/rooms/${id}`);
  return response.data.data;
};
