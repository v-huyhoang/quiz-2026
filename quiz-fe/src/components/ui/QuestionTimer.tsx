import { memo } from "react";
import { Timer, Clock } from "lucide-react";
import { useCountdown } from "../../hooks/useCountdown";

interface QuestionTimerProps {
  openedAt: string;
  limitSec: number;
  /** "player" = compact bar (default), "stage" = large display, "admin" = pill */
  variant?: "player" | "stage" | "admin";
  /** seconds remaining below which urgent styling kicks in (default: 10) */
  urgentThreshold?: number;
}

export const QuestionTimer = memo(function QuestionTimer({
  openedAt,
  limitSec,
  variant = "player",
  urgentThreshold = 10,
}: QuestionTimerProps) {
  const { timeLeft } = useCountdown({ openedAt, duration: limitSec });
  const isUrgent = timeLeft <= urgentThreshold;
  const pad = timeLeft.toString().padStart(2, "0");

  if (variant === "stage") {
    return (
      <div
        className={`flex items-center gap-3 font-mono text-4xl font-black px-8 py-4 rounded-2xl border shadow-lg transition-all ${
          isUrgent
            ? "text-red-500 border-red-300 bg-red-50"
            : "text-secondary border-gray-200 bg-white"
        }`}
      >
        <Timer size={32} />
        0:{pad}
      </div>
    );
  }

  if (variant === "admin") {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-black ${
          timeLeft <= 5 ? "bg-red-100 text-red-600" : "bg-orange-50 text-orange-600"
        }`}
      >
        <Clock size={14} className={timeLeft <= 5 ? "animate-pulse" : ""} />
        {timeLeft}s
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-2 rounded-lg border shadow-sm transition-colors ${
        isUrgent
          ? "text-red-500 border-red-200 bg-red-50"
          : "text-primary border-gray-200 bg-white"
      }`}
    >
      <Timer size={20} />
      0:{pad}
    </div>
  );
});
