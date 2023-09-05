import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/User.schema';
import { UsersAdminController } from './users.admin.controller';
import { Room, RoomSchema } from 'src/schemas/Room.schema';
import { Message, MessageSchema } from 'src/schemas/Message.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Room.name, schema: RoomSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  controllers: [UsersController, UsersAdminController],
  providers: [UsersService],
})
export class UsersModule {}
