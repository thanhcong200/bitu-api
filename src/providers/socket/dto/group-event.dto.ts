import { IsNotEmpty, IsString } from 'class-validator';

export class NewGroupEventDto {
  @IsNotEmpty()
  @IsString()
  senderId: string;

  @IsNotEmpty()
  @IsString()
  roomId: string;
}
