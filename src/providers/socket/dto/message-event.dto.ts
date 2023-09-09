import { IsNotEmpty, IsString } from 'class-validator';
import { ReceiveMessageDto } from 'src/room/dto/receive-message.dto';

export class MessageEventDto extends ReceiveMessageDto {}
