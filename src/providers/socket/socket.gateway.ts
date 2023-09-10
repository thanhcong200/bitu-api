import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { User, UserDocument } from 'src/schemas/User.schema';
import { RoomService } from 'src/room/room.service';
import { CommonService } from 'src/common-service/common-service.service';
import { Utils } from 'src/common/utils';
import { MessageEventDto } from './dto/message-event.dto';
import { NewGroupEventDto } from './dto/group-event.dto';
import { SOCKET_EVENT, SOCKET_SUBCRIBE } from './socket.enum';

@WebSocketGateway({
  cors: true,
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(SocketGateway.name);

  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private roomService: RoomService,
    private commonService: CommonService,
  ) {}

  @WebSocketServer()
  server: Server;

  afterInit() {
    this.logger.log('Initialize WebSocket');
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(
      `Client disconnected: ${client.id}`,
      client.handshake.query['roomId'],
    );
    const roomId: string = client.handshake.query['roomId'].toString();
    const partners = await this.roomService.findPartner(roomId);
    partners.forEach(({ partnerId, roomId }) => {
      client
        .to(partnerId.toString())
        .emit(SOCKET_EVENT.OFFLINE, { roomId, isOnline: false });
    });
    await this.userModel.findByIdAndUpdate(roomId, {
      $set: { isOnline: false },
    });
  }

  async handleConnection(client: Socket, ...args: any[]) {
    if (client.handshake.query['roomId']) {
      const roomId: string = client.handshake.query['roomId'].toString();
      this.logger.log(`Client connected roomId = ${roomId}`);
      await this.userModel.findByIdAndUpdate(roomId, {
        $set: { isOnline: true },
      });
      client.join(roomId);
      const partners = await this.roomService.findPartner(roomId);
      partners.forEach(({ partnerId, roomId }) => {
        client
          .to(partnerId.toString())
          .emit(SOCKET_EVENT.OFFLINE, { roomId, isOnline: true });
      });
    }
  }

  @SubscribeMessage(SOCKET_SUBCRIBE.MESSAGE)
  async handleMessages(client: Socket, payload: MessageEventDto) {
    payload._id = Utils.createObjectId();
    let members = await this.commonService.getCache(payload.roomId);
    if (!members) {
      members = await this.roomService.findMembers(payload.roomId);
      await this.commonService.setCache(payload.roomId, members);
    }
    const message = {
      _id: payload._id,
      roomId: Utils.toObjectId(payload.roomId),
      sender: {
        id: payload.senderId,
        username: null,
        avatar: null,
      },
      message: payload.message,
    };
    members.forEach((id) => {
      if (id !== payload.senderId) {
        client.to(id).emit(SOCKET_EVENT.MESSAGE, {
          message,
        });
      }
    });
    await this.roomService.receiveMessage(payload);
  }

  @SubscribeMessage(SOCKET_SUBCRIBE.GROUP)
  async handleGroups(client: Socket, payload: NewGroupEventDto) {
    const group = await this.roomService.findOne(payload);

    group.members.forEach((member) => {
      if (member.id.toString() !== payload.senderId) {
        client.to(member.id.toString()).emit(SOCKET_EVENT.NEW_GROUP, {
          group,
        });
      }
    });
  }
}
