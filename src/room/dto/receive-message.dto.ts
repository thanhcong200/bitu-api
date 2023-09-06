import { IsNotEmpty, IsString } from 'class-validator';

export class ReceiveMessageDto {
  @IsNotEmpty()
  @IsString()
  roomId: string;

  @IsNotEmpty()
  @IsString()
  senderId: string;

  @IsNotEmpty()
  @IsString()
  message: string;
}
