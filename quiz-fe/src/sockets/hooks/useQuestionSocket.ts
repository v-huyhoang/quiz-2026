import { useEffect } from 'react';
import { registerQuestionListeners } from '../listeners/register-question-listeners';

export function useQuestionSocket(gameId: string) {
  useEffect(() => {
    if (!gameId) return;
    registerQuestionListeners(gameId);
  }, [gameId]);
}
