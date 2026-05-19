import echo from '../echo';

export const getLeaderboardChannel = (gameId: string) => echo.channel(`leaderboard.${gameId}`);
