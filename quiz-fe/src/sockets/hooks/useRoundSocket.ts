import { useEffect } from 'react';
import { registerRoundListeners } from '../listeners/register-round-listeners';

export function useRoundSocket(roundId: string) {
  useEffect(() => {
    if (!roundId) return;
    registerRoundListeners(roundId);
  }, [roundId]);
}
