import { getEcho } from '../echo';

export const getLeaderboardChannel = (gameId: string) => getEcho().channel(`leaderboard.${gameId}`);
