import echo from '../echo';

export const getRoundChannel = (roundId: string) => echo.channel(`round.${roundId}`);
