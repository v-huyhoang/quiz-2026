import echo from '../echo';

export const getRoomChannel = (roomId: string) => echo.channel(`room.${roomId}`);
