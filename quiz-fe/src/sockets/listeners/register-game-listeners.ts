import { getGameChannel } from '../channels/game-channel';
import { useGameStore } from '../../store/gameStore';

export function registerGameListeners(gameId: string) {
  const updateGame = useGameStore.getState().updateGame;
  const channel = getGameChannel(gameId);
  channel.listen('GameStarted', (data: any) => {
    updateGame({ status: 'started', ...data });
  });
  channel.listen('GameFinished', (data: any) => {
    updateGame({ status: 'finished', ...data });
  });
  // Thêm các listener khác nếu cần
  return channel;
}
