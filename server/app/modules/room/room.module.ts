import { RoomService } from '@app/services/room/room.service';
import { Module } from '@nestjs/common';

@Module({
    providers: [RoomService],
    exports: [RoomService],
})
export class RoomModule {}
