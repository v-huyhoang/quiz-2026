import { getGameChannel } from '../channels/game-channel';
import { useGameStore } from '../../store/gameStore';

export function registerGameListeners(gameId: string) {
  const updateGame = useGameStore.getState().updateGame;
  const channel = getGameChannel(gameId);
  channel.listen('.game.started', (data: any) => {
    updateGame({ status: 'active', ...data });
  });

  // Thêm các listener khác nếu cần
  return channel;
}
