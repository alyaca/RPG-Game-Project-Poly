import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Message extends Document {
    @Prop({ type: String, required: true })
    roomId: string;

    @Prop({ type: String, required: true })
    username: string;

    @Prop({ type: String, required: true })
    message: string;

    @Prop({ type: Date, required: true })
    timestamp: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
