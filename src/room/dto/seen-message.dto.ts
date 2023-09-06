import { IsNotEmpty, IsString } from 'class-validator';

export class SeenMessageDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  roomId: string;

  @IsNotEmpty()
  @IsString()
  messageId: string;
}
