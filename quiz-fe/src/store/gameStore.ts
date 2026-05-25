import { create } from "zustand";

interface Question {
  id: number;
  content: string;
  options: { id: number; content: string }[];
  openedAt: string;
  timeLimit: number; // seconds
}

interface GameState {
  gameId: number | null;
  roundId: number | null;
  roundNumber: number | null;
  gameStatus: "waiting" | "active" | "finished";
  roundStatus: "waiting" | "active" | "finished";
  questionStatus: "waiting" | "open" | "closed";
  currentQuestion: Question | null;
  submittedQuestionIds: number[];
  leaderboard?: any;
  roundData?: any;

  setGame: (gameId: number) => void;
  setRound: (roundId: number, roundNumber: number) => void;
  setQuestion: (question: Question) => void;
  setQuestionStatus: (status: "waiting" | "open" | "closed") => void;
  markSubmitted: (questionId: number) => void;
  hasSubmitted: (questionId: number) => boolean;
  reset: () => void;
  updateGame: (data: any) => void;
  updateLeaderboard: (data: any) => void;
  updateQuestion: (data: any) => void;
  updateRound: (data: any) => void;
}

export const useGameStore = create<GameState>()((set, get) => ({
  gameId: null,
  roundId: null,
  roundNumber: null,
  gameStatus: "waiting",
  roundStatus: "waiting",
  questionStatus: "waiting",
  currentQuestion: null,
  submittedQuestionIds: [],
  leaderboard: undefined,
  roundData: undefined,

  setGame: (gameId) => set({ gameId }),
  setRound: (roundId, roundNumber) => set({ roundId, roundNumber }),
  setQuestion: (question) =>
    set({ currentQuestion: question, questionStatus: "open" }),
  setQuestionStatus: (status) => set({ questionStatus: status }),
  markSubmitted: (questionId) =>
    set((s) => ({
      submittedQuestionIds: [...s.submittedQuestionIds, questionId],
    })),
  hasSubmitted: (questionId) =>
    get().submittedQuestionIds.includes(questionId),
  reset: () =>
    set({
      gameId: null,
      roundId: null,
      roundNumber: null,
      gameStatus: "waiting",
      roundStatus: "waiting",
      questionStatus: "waiting",
      currentQuestion: null,
      submittedQuestionIds: [],
      leaderboard: undefined,
      roundData: undefined,
    }),
  updateGame: (data) => set({ gameStatus: data.status, ...data }),
  updateLeaderboard: (data) => set({ leaderboard: data }),
  updateQuestion: (data) => set((s) => ({ ...s, ...data })),
  updateRound: (data) => set({ roundData: data }),
}));
