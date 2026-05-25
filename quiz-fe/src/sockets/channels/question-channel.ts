import { getEcho } from '../echo';

export const getQuestionChannel = (questionId: string) => getEcho().channel(`question.${questionId}`);
