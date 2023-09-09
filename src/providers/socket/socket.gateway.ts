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
import { ReceiveMessageDto } from 'src/room/dto/receive-message.dto';
import { RoomService } from 'src/room/room.service';
import { CommonService } from 'src/common-service/common-service.service';
import { Utils } from 'src/common/utils';

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
    }
  }

  @SubscribeMessage('messages')
  async handleMessages(client: Socket, payload: ReceiveMessageDto) {
    payload._id = Utils.createObjectId();
    const members = await this.commonService.getCache(payload.roomId);
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
    console.log(members);
    members.map((id) =>
      client.to(id.toString()).emit('message-recieve', {
        message,
      }),
    );
    await this.roomService.receiveMessage(payload);
  }
}
