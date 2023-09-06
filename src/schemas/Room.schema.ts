import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import mongoose from 'mongoose';

const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

export type RoomDocument = Room & Document;
export class Member {
  @Prop({ type: mongoose.Types.ObjectId, ref: 'User' })
  id: object;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Message' })
  messageId: object;
}
@Schema({
  timestamps: true,
})
export class Room {
  @Prop()
  name: string;

  @Prop([{ type: Member }])
  members: Member[];
}

export const RoomSchema = SchemaFactory.createForClass(Room);
RoomSchema.plugin(aggregatePaginate);
