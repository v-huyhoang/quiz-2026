import echo from '../echo';

export const getGameChannel = (gameId: string) => echo.channel(`game.${gameId}`);
