import { getRoundChannel } from '../channels/round-channel';
import { useGameStore } from '../../store/gameStore';

export function registerRoundListeners(roundId: string) {
  const updateRound = useGameStore.getState().updateRound;
  const channel = getRoundChannel(roundId);
  channel.listen('RoundStarted', (data: any) => {
    updateRound({ status: 'started', ...data });
  });
  channel.listen('RoundFinished', (data: any) => {
    updateRound({ status: 'finished', ...data });
  });
  channel.listen('RoundResult', (data: any) => {
    updateRound({ result: data });
  });
  return channel;
}
