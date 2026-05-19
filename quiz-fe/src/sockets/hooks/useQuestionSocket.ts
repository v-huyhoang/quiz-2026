import { useEffect } from 'react';
import { registerQuestionListeners } from '../listeners/register-question-listeners';

export function useQuestionSocket(questionId: string) {
  useEffect(() => {
    if (!questionId) return;
    const channel = registerQuestionListeners(questionId);
    return () => {
      channel.stopListening();
    };
  }, [questionId]);
}
