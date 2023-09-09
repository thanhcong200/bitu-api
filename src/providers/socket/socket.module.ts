import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/User.schema';
import { SocketGateway } from './socket.gateway';
import { Room, RoomSchema } from 'src/schemas/Room.schema';
import { Message, MessageSchema } from 'src/schemas/Message.schema';
import { RoomService } from 'src/room/room.service';
import { CommonService } from 'src/common-service/common-service.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Room.name, schema: RoomSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  providers: [SocketGateway, RoomService, CommonService],
  exports: [SocketGateway],
})
export class SocketModule {}
