import { useEffect, useMemo, useState } from 'react';

type UseCountdownProps = {
  openedAt?: string;
  duration?: number;
};

export function useCountdown({
  openedAt,
  duration = 0,
}: UseCountdownProps) {
  const calculateTimeLeft = () => {
    if (!openedAt || !duration) return 0;

    const start = new Date(openedAt).getTime();
    const now = Date.now();

    const elapsed = Math.floor((now - start) / 1000);

    return Math.max(duration - elapsed, 0);
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [openedAt, duration]);

  const isExpired = useMemo(() => timeLeft <= 0, [timeLeft]);

  return {
    timeLeft,
    isExpired,
  };
}