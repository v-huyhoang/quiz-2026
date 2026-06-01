import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ANSWER_LABELS = ["A", "B", "C", "D"] as const;

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const axiosError = error as {
      response?: { data?: { message?: string; errors?: Record<string, string[]> } };
    };
    const msg = axiosError.response?.data?.message;
    if (msg) return msg;
    const errors = axiosError.response?.data?.errors;
    if (errors) {
      const first = Object.values(errors)[0]?.[0];
      if (first) return first;
    }
  }
  return fallback;
}
