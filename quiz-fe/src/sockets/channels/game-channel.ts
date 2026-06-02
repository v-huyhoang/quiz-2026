import { getEcho } from '../echo';

export const getGameChannel = (gameId: string) => getEcho()?.channel(`game.${gameId}`) ?? null;
