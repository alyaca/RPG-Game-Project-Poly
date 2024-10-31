import { IMessage } from '@app/interfaces/message.interface';
import { Message } from '@app/model/schema/message.schema';
import { ChatService } from '@app/services/chat/chat.service';
import { Controller, Get, HttpStatus, Param, Res } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { Response } from 'express';

@Controller('chat')
export class ChatController {
    constructor(private chatService: ChatService) {}

    @ApiOkResponse({
        description: 'Returns all messages in a room',
        type: Message,
        isArray: true,
    })
    @Get('/:roomId')
    async getMessagesByRoomId(@Param('roomId') roomId: string, @Res() response: Response) {
        try {
            const messages: IMessage[] = await this.chatService.getMessagesByRoom(roomId);
            return response.status(HttpStatus.OK).json(messages);
        } catch (error) {
            response.status(HttpStatus.BAD_REQUEST).send(error.message);
        }
    }
}
