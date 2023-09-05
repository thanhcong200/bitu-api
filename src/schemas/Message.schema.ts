import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

export type MessageDocument = Message & Document;

@Schema({
  timestamps: true,
})
export class Message {
  @Prop({ type: mongoose.Types.ObjectId, ref: 'Room' })
  roomId: object;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User' })
  senderId: object;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User' })
  receiverId: object;

  @Prop({ required: true })
  message: string;

  @Prop({ default: false })
  isRead: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.plugin(aggregatePaginate);
