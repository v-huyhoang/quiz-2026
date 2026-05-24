import { getStageChannel } from '../channels/stage-channel';
import { useGameStore } from '../../store/gameStore';

export function registerStageListeners() {
  const updateGame = useGameStore.getState().updateGame;
  const updateQuestion = useGameStore.getState().updateQuestion;
  const channel = getStageChannel();
  
  channel.listen('game.started', (data: any) => {
    updateGame({ status: 'active', ...data });
  });
  
  channel.listen('question.started', (data: any) => {
    updateQuestion({ status: 'open', ...data });
  });
  
  return channel;
}
