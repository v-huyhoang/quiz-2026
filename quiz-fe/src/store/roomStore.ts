import { create } from "zustand";

interface RoomState {
  roomId: number | null;
  roomData?: any;

  setRoom: (roomId: number) => void;
  updateRoom: (data: any) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>()((set) => ({
  roomId: null,
  roomData: undefined,

  setRoom: (roomId) => set({ roomId }),
  updateRoom: (data) => set({ roomData: data }),
  reset: () =>
    set({
      roomId: null,
      roomData: undefined,
    }),
}));
