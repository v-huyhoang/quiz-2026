import echo from '../echo';

export const getQuestionChannel = (questionId: string) => echo.channel(`question.${questionId}`);
