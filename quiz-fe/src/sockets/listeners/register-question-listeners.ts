import { useGameStore } from '../../store/gameStore';
import { getGameChannel } from '../channels/game-channel';

export function registerQuestionListeners(gameId: string) {
  const updateQuestion = useGameStore.getState().updateQuestion;
  const channel = getGameChannel(gameId);
  channel.listen('question.started', (data: any) => {
    updateQuestion({ status: 'open', ...data });
  });
  channel.listen('QuestionClosed', (data: any) => {
    updateQuestion({ status: 'closed', ...data });
  });
  channel.listen('SubmissionReceived', (data: any) => {
    updateQuestion({ submission: data });
  });
  return channel;
}
