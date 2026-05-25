export interface Room {
  id: string;
  name: string;
  rounds: number;
  questionsPerRound: number;
  status: "pending" | "active" | "finished";
  accessCode: string;
  questionMode: "random" | "manual";
}

export interface QuestionSummary {
  id: number;
  text: string;
  category?: string;
}

export type RoundQuestionMap = Record<number, number[]>;