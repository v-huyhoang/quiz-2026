import { getGameChannel } from '../channels/game-channel';
import { getStageChannel } from '../channels/stage-channel';
import { useGameStore } from '../../store/gameStore';

export function registerGameListeners(gameId: string) {
  const updateGame = useGameStore.getState().updateGame;
  const updateQuestion = useGameStore.getState().updateQuestion;
  const channel = getGameChannel(gameId);
  
  channel.listen('.game.started', (data: any) => {
    updateGame({ 
      gameStatus: 'active', 
      roundStatus: 'active',
      ...data 
    });
  });

  channel.listen('.question.started', (data: any) => {
    updateQuestion({
      currentQuestion: {
        id: data.question.id,
        content: data.question.content,
        type: data.question.type,
        timeLimit: data.time_limit_seconds,
        options: data.question.answers,
        openedAt: new Date().toISOString(),
      },
      questionStatus: 'open',
    });
  });

  channel.listen('.question.closed', () => {
    updateQuestion({
      questionStatus: 'closed',
    });
  });

  return channel;
}

export function registerStageListeners() {
  const updateQuestion = useGameStore.getState().updateQuestion;
  const channel = getStageChannel();
  
  channel.listen('.question.started', (data: any) => {
    updateQuestion({
      currentQuestion: {
        id: data.question.id,
        content: data.question.content,
        type: data.question.type,
        timeLimit: data.time_limit_seconds,
        options: data.question.answers,
        openedAt: new Date().toISOString(),
      },
      questionStatus: 'open',
    });
  });

  return channel;
}
