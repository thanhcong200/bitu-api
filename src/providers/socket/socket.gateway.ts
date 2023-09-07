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
  ) {}

  @WebSocketServer()
  server: Server;

  afterInit() {
    this.logger.log('Initialize WebSocket');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  async handleConnection(client: Socket, ...args: any[]) {
    if (!client.handshake.query['roomId']) {
      this.logger.error(`Missing required parameters: roomId`);
      client.disconnect(true);
      return;
    }
    const roomId: string = client.handshake.query['roomId'].toString();
    this.logger.log(`Client connected [${client.id}]: ${roomId}`);
    client.join(roomId);
  }

  @SubscribeMessage('messages')
  async handleMessages(client: Socket, payload: ReceiveMessageDto) {
    const message = (await this.roomService.receiveMessage(payload))[0];

    client.to(payload.roomId).emit('message-recieve', {
      message,
    });
  }
}
