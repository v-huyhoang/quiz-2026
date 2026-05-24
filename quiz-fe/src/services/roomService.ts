import { api } from "./api";

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
  /** Chỉ gửi khi question_mode === "manual" */
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
  join_url: string;
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
  }
}
/** Player: tham gia phòng bằng access code + tên team */
export const joinRoom = (code: string, teamName: string) =>
  api.post<JoinRoomResponse>(`/rooms/${code}/join`, { team_name: teamName });

/** Admin: tạo phòng mới */
export const createRoom = (payload: CreateRoomPayload) =>
  api.post<CreateRoomResponse>("/admin/rooms", payload);

/** Admin: get danh sách phòng */
export const getRooms = async () => {
  const response = await api.get<CreateRoomResponse[]>("/admin/rooms");

  return response.data;
};

/** Admin: xóa phòng */
export const deleteRoom = async (id: string) => {
  const response = await api.delete(`/admin/rooms/${id}`);
  return response.data;
};
