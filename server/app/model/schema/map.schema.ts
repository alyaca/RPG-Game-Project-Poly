import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type MapDocument = Map & Document;

@Schema()
export class Map {
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
    @Prop({ type: [Number], required: true })
    tiles: number[];

    @ApiProperty()
    @Prop({ required: true })
    dimension: number;

    @ApiProperty()
    @Prop({ type: [String], required: true })
    itemPlacement: string[];

    @ApiProperty()
    @Prop({ type: Date, required: true })
    lastModification: Date;
}

export const mapSchema = SchemaFactory.createForClass(Map);
