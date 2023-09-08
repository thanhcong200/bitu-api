import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

export type MessageDocument = Message & Document;
export class Sender {
  @Prop({ type: mongoose.Types.ObjectId, ref: 'User' })
  id: object;

  @Prop()
  username: string;

  @Prop()
  avatar: string;
}
@Schema({
  timestamps: true,
})
export class Message {
  @Prop({ type: mongoose.Types.ObjectId, ref: 'Room' })
  roomId: object;

  @Prop({ type: Sender })
  sender: Sender;

  @Prop({ required: true })
  message: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.plugin(aggregatePaginate);
