import { useEffect } from 'react';
import { registerRoomListeners } from '../listeners/register-room-listeners';

export function useRoomSocket(roomId: string) {
  useEffect(() => {
    if (!roomId) return;
    registerRoomListeners(roomId);
  }, [roomId]);
}
