import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import mongoose from 'mongoose';

const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

export type RoomDocument = Room & Document;

@Schema({
  timestamps: true,
})
export class Room {
  @Prop()
  name: string;

  @Prop([{ type: mongoose.Types.ObjectId, ref: 'User' }])
  members: object[];
}

export const RoomSchema = SchemaFactory.createForClass(Room);
RoomSchema.plugin(aggregatePaginate);
