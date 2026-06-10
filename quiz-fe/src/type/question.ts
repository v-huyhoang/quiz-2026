export type QuestionType = "single_choice" | "image_input";

export interface Question {
  id: string;
  type: QuestionType;
  text: string | null;
  imageUrl?: string | null;
  answerText?: string | null;
  number?: number;
  total?: number;
  timeRemaining?: number;
  totalTime: number;
  options: Option[];
}

export interface Option {
  id: string;
  text: string;
  percentage?: number;
  isCorrect?: boolean;
}
