import { useEffect } from 'react';
import { registerGameListeners } from '../listeners/register-game-listeners';

export function useGameSocket(gameId: string) {
  useEffect(() => {
    if (!gameId) return;
    registerGameListeners(gameId);
  }, [gameId]);
}
