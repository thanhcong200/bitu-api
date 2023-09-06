import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { Member, Room } from './Room.schema';
import { User } from './User.schema';

const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

export type MessageDocument = Message & Document;
export class Sender {
  @Prop({ type: mongoose.Types.ObjectId, ref: User.name })
  id: object;

  @Prop({ default: true })
  username: string;
}
@Schema({
  timestamps: true,
})
export class Message {
  @Prop({ type: mongoose.Types.ObjectId, ref: Room.name })
  roomId: object;

  @Prop({ type: Sender })
  sender: Sender;

  @Prop({ required: true })
  message: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.plugin(aggregatePaginate);
