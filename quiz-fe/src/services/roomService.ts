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
  max_teams: number;
  access_code: string;
  question_mode: "random" | "manual";
  round_questions?: RoundQuestionAssignment[];
}

export interface CreateRoomData {
  id: number;
  name: string;
  access_code: string;
  rounds: number;
  questions_per_round: number;
  max_teams: number;
  question_mode: "random" | "manual";
  status: "pending" | "active" | "finished";
  join_url: string;
}

export interface CreateRoomResponse {
  success: boolean;
  code: number;
  message: string;
  data: CreateRoomData;
}

export interface RoomsResponse {
  success: boolean;
  code: number;
  message: string;
  data: {
    data: CreateRoomResponse[];
    meta: {
      currentPage: number;
      from: number;
      lastPage: number;
      perPage: number;
      to: number;
      total: number;
    };
  };
}
/** Player: tham gia phòng bằng access code + tên team */
export const joinRoom = (code: string, teamName: string) =>
  api.post<ApiResponse<JoinRoomResponse>>(`/rooms/${code}/join`, { team_name: teamName });

/** Admin: tạo phòng mới */
export const createRoom = (payload: CreateRoomPayload) =>
  api.post<ApiResponse<CreateRoomData>>("/admin/rooms", payload);

/** Admin: get danh sách phòng (flat array) */
export const getRooms = () =>
  api.get<ApiResponse<CreateRoomData[]>>("/admin/rooms");

/** Admin: xóa phòng */
export const deleteRoom = (id: string) =>
  api.delete(`/admin/rooms/${id}`);

/** Admin: lấy chi tiết phòng */
export const getRoomDetail = async (id: string) => {
  const response = await api.get(`/admin/rooms/${id}`);
  return response.data.data;
};

export const getRoomByCode = async (code: string) => {
  const response = await api.get<{ success: boolean; data: any }>(
    `/rooms/code/${code}`,
  );
  return response.data.data;
};
