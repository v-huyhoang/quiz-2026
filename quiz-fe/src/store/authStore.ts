import { create } from "zustand";
import { persist } from "zustand/middleware";

type Role = "player" | "admin";

interface AuthState {
  token: string | null;
  teamId: number | null;
  teamName: string | null;
  gameId: number | null;
  role: Role | null;

  setAuth: (payload: {
    token: string;
    teamId?: number;
    teamName?: string;
    gameId?: number;
    role: Role;
  }) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      teamId: null,
      teamName: null,
      gameId: null,
      role: null,

      setAuth: ({ token, teamId, teamName, gameId, role }) =>
        set({ token, teamId: teamId ?? null, teamName: teamName ?? null, gameId: gameId ?? null, role }),

      clearAuth: () =>
        set({ token: null, teamId: null, teamName: null, gameId: null, role: null }),

      isAuthenticated: () => !!get().token,
    }),
    {
      name: "quiz-auth", // localStorage key
    }
  )
);
