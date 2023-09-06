import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { User, UserDocument, UserRole } from 'src/schemas/User.schema';
import { SOCKET_ROOM } from './socket.enum';

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
    if (!client.handshake.query['groupId']) {
      this.logger.error(`Missing required parameters: groupId`);
      client.disconnect(true);
      return;
    }
    const groupId: string = client.handshake.query['groupId'].toString();
    this.logger.log(`Client connected [${client.id}]: ${groupId}`);
    client.join(groupId);
  }
}
