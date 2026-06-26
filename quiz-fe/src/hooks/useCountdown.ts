import { useEffect, useMemo, useState } from 'react';

type UseCountdownProps = {
  openedAt?: string;
  duration?: number;
};

export function useCountdown({
  openedAt,
  duration = 0,
}: UseCountdownProps) {
  const getServerNow = () => {
    const offset = (window as any).serverOffset ?? 0;
    return Date.now() + offset;
  };

  const calculateState = () => {
    if (!openedAt || !duration) return { timeLeft: 0, progress: 0 };

    const start = new Date(openedAt).getTime();
    const elapsedMs = getServerNow() - start;
    const remainingMs = Math.max(duration * 1000 - elapsedMs, 0);

    return {
      timeLeft: Math.ceil(remainingMs / 1000),
      progress: (remainingMs / (duration * 1000)) * 100,
    };
  };

  const initial = calculateState();
  const [timeLeft, setTimeLeft] = useState(initial.timeLeft);
  const [progress, setProgress] = useState(initial.progress);

  useEffect(() => {
    const update = () => {
      const { timeLeft: t, progress: p } = calculateState();
      setTimeLeft(t);
      setProgress(p);
    };

    update();
    const interval = setInterval(update, 100);

    return () => clearInterval(interval);
  }, [openedAt, duration]);

  const isExpired = useMemo(() => timeLeft <= 0, [timeLeft]);

  return {
    timeLeft,
    progress,
    isExpired,
  };
}