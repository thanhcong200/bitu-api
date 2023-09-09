import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
const paginate = require('mongoose-paginate-v2');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Schema({
  timestamps: true,
})
export class User {
  @Prop({ unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  avatar: string;

  @Prop({ default: UserRole.USER })
  role: UserRole;

  @Prop({ default: false })
  isOnline: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.plugin(paginate);
UserSchema.plugin(aggregatePaginate);
