import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type MapDocument = Map & Document;

@Schema()
export class Map {
    @ApiProperty()
    // @Prop({ type: MongooseSchema.Types.ObjectId })
    _id?: MongooseSchema.Types.ObjectId;

    @ApiProperty()
    @Prop({ required: true })
    name: string;

    @ApiProperty()
    @Prop({ required: true })
    description: string;

    @ApiProperty()
    @Prop({ required: true, type: Boolean })
    visible: boolean;

    @ApiProperty()
    @Prop({ required: true })
    mode: string;

    @ApiProperty()
    @Prop({ required: true })
    nbPlayers: number;

    @ApiProperty()
    @Prop({ required: true })
    image: string;

    @ApiProperty()
    @Prop({ required: true })
    tiles: number[][];

    @ApiProperty()
    @Prop({ required: true })
    dimension: number;

    @ApiProperty()
    @Prop({ required: true })
    itemPlacement: number[][];

    @ApiProperty()
    @Prop({ required: false })
    isSelected: boolean;

    @ApiProperty()
    @Prop({ type: Date, required: true })
    lastModification: Date;
}

export const mapSchema = SchemaFactory.createForClass(Map);
