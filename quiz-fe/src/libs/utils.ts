import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ANSWER_LABELS = ["A", "B", "C", "D"] as const;

// BE generates image URLs using APP_URL (e.g. 192.168.1.x:8000) which may differ
// from what the browser uses to reach the API (e.g. localhost:8000).
// This replaces the origin in the URL with the API's origin so images always load.
export function resolveStorageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  try {
    const imgUrl = new URL(imageUrl);
    const apiUrl = new URL(import.meta.env.VITE_API_BASE_URL as string);
    imgUrl.protocol = apiUrl.protocol;
    imgUrl.hostname = apiUrl.hostname;
    imgUrl.port     = apiUrl.port;
    return imgUrl.toString();
  } catch {
    return imageUrl;
  }
}

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
