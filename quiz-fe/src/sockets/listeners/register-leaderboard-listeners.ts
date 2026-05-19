import { getLeaderboardChannel } from '../channels/leaderboard-channel';
import { useGameStore } from '../../store/gameStore';

export function registerLeaderboardListeners(gameId: string) {
  const updateLeaderboard = useGameStore.getState().updateLeaderboard;
  const channel = getLeaderboardChannel(gameId);
  channel.listen('LeaderboardUpdated', (data: any) => {
    updateLeaderboard(data);
  });
  return channel;
}
