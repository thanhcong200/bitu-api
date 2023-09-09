import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/User.schema';
import { Message, MessageSchema } from 'src/schemas/Message.schema';
import { Room, RoomSchema } from 'src/schemas/Room.schema';
import { CommonService } from 'src/common-service/common-service.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Room.name, schema: RoomSchema },
    ]),
  ],
  controllers: [RoomController],
  providers: [RoomService, CommonService],
  exports: [RoomService],
})
export class RoomModule {}
