export interface Room {
  id: string;
  name: string;
  rounds: number;
  questionsPerRound: number;
  maxTeams: number;
  status: "pending" | "active" | "finished";
  accessCode: string;
  questionMode: "random" | "manual";
}

export interface QuestionSummary {
  id: number;
  text: string;
  category?: string;
}

export interface FormState {
  name: string;
  rounds: string;
  questionsPerRound: string;
  maxTeams: string;
  accessCode: string;
  questionMode: "random" | "manual";
}

export interface CreateRoomPayload {
  name: string;
  rounds: number;
  questions_per_round: number;
  max_teams: number;
  access_code: string;
  question_mode: "random" | "manual";
  round_questions?: {
    round_number: number;
    question_ids: number[];
  }[];
}

export type RoundQuestionMap = Record<number, number[]>;
