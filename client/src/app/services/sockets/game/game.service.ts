import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    roomId: string;
    isRoomLocked: boolean;

    setRoomId(room: string) {
        this.roomId = room;
    }
}
