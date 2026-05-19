import { getRoomChannel } from '../channels/room-channel';
import { useRoomStore } from '../../store/roomStore';

export function registerRoomListeners(roomId: string) {
  const updateRoom = useRoomStore.getState().updateRoom;
  const channel = getRoomChannel(roomId);
  channel.listen('RoomUpdated', (data: any) => {
    updateRoom(data);
  });
  channel.listen('RoomDeleted', (data: any) => {
    updateRoom({ deleted: true, ...data });
  });
  return channel;
}
