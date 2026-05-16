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
  questionStatus: "pending" | "open" | "closed";
  currentQuestion: Question | null;
  submittedQuestionIds: number[];

  setGame: (gameId: number) => void;
  setRound: (roundId: number, roundNumber: number) => void;
  setQuestion: (question: Question) => void;
  setQuestionStatus: (status: "pending" | "open" | "closed") => void;
  markSubmitted: (questionId: number) => void;
  hasSubmitted: (questionId: number) => boolean;
  reset: () => void;
}

export const useGameStore = create<GameState>()((set, get) => ({
  gameId: null,
  roundId: null,
  roundNumber: null,
  questionStatus: "pending",
  currentQuestion: null,
  submittedQuestionIds: [],

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
      questionStatus: "pending",
      currentQuestion: null,
      submittedQuestionIds: [],
    }),
}));
