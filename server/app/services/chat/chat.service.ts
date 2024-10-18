import { IMessage } from '@app/interfaces/message.interface';
import { Message } from '@app/model/schema/message.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ChatService {
    constructor(
        @InjectModel(Message.name) private messageModel: Model<Message>
    ) {}

    async saveMessage(message: IMessage): Promise<Message> {
        const createdMessage = new this.messageModel(message);
        return createdMessage.save();
    }

    async getMessagesByRoom(roomId: string): Promise<Message[]> {
        return this.messageModel.find({ roomId }).sort({ timestamp: 1 }).exec();
    }
}
