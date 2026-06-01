import { create } from "zustand";
import type { CurrentQuestion, LeaderboardEntry } from "../type/game";

interface GameState {
  gameId: number | null;
  roundId: number | null;
  roundNumber: number | null;
  gameStatus: "waiting" | "active" | "finished";
  roundStatus: "waiting" | "active" | "finished";
  questionStatus: "waiting" | "open" | "closed";
  currentQuestion: CurrentQuestion | null;
  submittedQuestionIds: number[];
  leaderboard: LeaderboardEntry[] | null;

  setGame: (gameId: number) => void;
  setRound: (roundId: number, roundNumber: number) => void;
  setQuestion: (question: CurrentQuestion) => void;
  setQuestionStatus: (status: "waiting" | "open" | "closed") => void;
  markSubmitted: (questionId: number) => void;
  hasSubmitted: (questionId: number) => boolean;
  reset: () => void;
}

const initialState = {
  gameId: null,
  roundId: null,
  roundNumber: null,
  gameStatus: "waiting" as const,
  roundStatus: "waiting" as const,
  questionStatus: "waiting" as const,
  currentQuestion: null,
  submittedQuestionIds: [],
  leaderboard: null,
};

export const useGameStore = create<GameState>()((set, get) => ({
  ...initialState,

  setGame: (gameId) => set({ gameId }),
  setRound: (roundId, roundNumber) => set({ roundId, roundNumber }),
  setQuestion: (question) => set({ currentQuestion: question, questionStatus: "open" }),
  setQuestionStatus: (status) => set({ questionStatus: status }),
  markSubmitted: (questionId) =>
    set((s) => ({ submittedQuestionIds: [...s.submittedQuestionIds, questionId] })),
  hasSubmitted: (questionId) => get().submittedQuestionIds.includes(questionId),
  reset: () => set(initialState),
}));
