import { getEcho } from '../echo';

export const getRoundChannel = (roundId: string) => getEcho().channel(`round.${roundId}`);
