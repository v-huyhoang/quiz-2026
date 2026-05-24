import { getAdminChannel } from '../channels/admin-channel';
import { useGameStore } from '../../store/gameStore';

export function registerAdminListeners() {
  const updateGame = useGameStore.getState().updateGame;
  const updateQuestion = useGameStore.getState().updateQuestion;
  const channel = getAdminChannel();
  
  channel.listen('game.started', (data: any) => {
    updateGame({ status: 'active', ...data });
  });
  
  channel.listen('question.started', (data: any) => {
    updateQuestion({ status: 'open', ...data });
  });
  
  return channel;
}
