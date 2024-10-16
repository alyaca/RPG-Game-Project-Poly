import { Injectable } from '@nestjs/common';
import { RoomService } from '../room/room.service';

@Injectable()
export class GameService {
    constructor(private roomService: RoomService) {}

    toggleLockRoom(roomId: string, isLocked: boolean) {
        const game = this.getGame(roomId);
        game.isLocked = isLocked;
    }

    getGame(roomId) {
        return this.roomService.rooms.get(roomId);
    }

    connectPlayerToGame(roomId: string) {
        const game = this.getGame(roomId);
        if (!this.roomService.isRoomActive(roomId)) {
            return { event: 'joinError', errorType: 'roomNotFound' };
        }
        if (game.isLocked) {
            return { event: 'joinError', errorType: 'roomLocked' };
        }
        return { event: 'joinedRoom' };
    }
}
