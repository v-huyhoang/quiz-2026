import { useGameStore } from '../../store/gameStore';
import { getQuestionChannel } from '../channels/question-channel';

export function registerQuestionListeners(questionId: string) {
  const updateQuestion = useGameStore.getState().updateQuestion;
  const channel = getQuestionChannel(questionId);
  channel.listen('QuestionOpened', (data: any) => {
    updateQuestion({ status: 'opened', ...data });
  });
  channel.listen('QuestionClosed', (data: any) => {
    updateQuestion({ status: 'closed', ...data });
  });
  channel.listen('SubmissionReceived', (data: any) => {
    updateQuestion({ submission: data });
  });
  return channel;
}
