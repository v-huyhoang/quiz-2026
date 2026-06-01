import { memo } from "react";
import { Clock } from "lucide-react";
import { useCountdown } from "../../hooks/useCountdown";

interface QuestionTimerProps {
  openedAt: string;
  limitSec: number;
  /** "player" = compact progress bar, "stage" = large progress bar, "admin" = pill */
  variant?: "player" | "stage" | "admin";
  /** seconds remaining below which urgent styling kicks in (default: 10) */
  urgentThreshold?: number;
}

function getBarColor(progress: number) {
  if (progress <= 20) return "bg-red-500";
  if (progress <= 40) return "bg-orange-500";
  return "bg-green-500";
}

function getTrackColor(isUrgent: boolean) {
  return isUrgent ? "bg-red-100" : "bg-gray-200";
}

export const QuestionTimer = memo(function QuestionTimer({
  openedAt,
  limitSec,
  variant = "player",
  urgentThreshold = 10,
}: QuestionTimerProps) {
  const { timeLeft, progress } = useCountdown({ openedAt, duration: limitSec });
  const isUrgent = timeLeft <= urgentThreshold;

  if (variant === "stage") {
    return (
      <div className="w-80">
        <div className={`relative h-5 rounded-full overflow-hidden ${getTrackColor(isUrgent)}`}>
          <div
            className={`h-full rounded-full transition-all duration-100 ease-linear ${getBarColor(progress)}`}
            style={{ width: `${progress}%` }}
          />
        </div>
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

  // player variant
  return (
    <div className="w-36">
      <div className={`relative h-2.5 rounded-full overflow-hidden ${getTrackColor(isUrgent)}`}>
        <div
          className={`h-full rounded-full transition-all duration-100 ease-linear ${getBarColor(progress)}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
});
