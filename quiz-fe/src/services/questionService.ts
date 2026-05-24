import { api } from "./api";

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  totalTime: number;
  options: QuestionOption[];
}

export interface QuestionsResponse {
  success: boolean;
  code: number;
  message: string;
  data: {
    data: Question[];
    meta: {
      currentPage: number;
      from: number;
      lastPage: number;
      perPage: number;
      to: number;
      total: number;
    };
  };
}

export const getQuestions = async () => {
  const response = await api.get<QuestionsResponse>("/admin/questions");

  return response.data.data;
};