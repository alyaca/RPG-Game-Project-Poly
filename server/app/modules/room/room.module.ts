import { ChatModule } from '@app/modules/chat/chat.module';
import { RoomService } from '@app/services/room/room.service';
import { Module } from '@nestjs/common';

@Module({
    imports: [ChatModule],
    providers: [RoomService],
    exports: [RoomService],
})
export class RoomModule {}
