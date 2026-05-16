export interface Question {
  id: string;
  text: string;
  number?: number;
  total?: number;
  timeRemaining?: number;
  totalTime: number;
  options: Option[];
  category?: string;
}

export interface Option {
  id: string;
  text: string;
  percentage?: number;
  isCorrect?: boolean;
}