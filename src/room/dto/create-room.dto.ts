import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRoomDto {
  @IsNotEmpty()
  @IsString()
  members: string;

  @IsOptional()
  @IsString()
  name: string;
}
