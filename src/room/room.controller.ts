import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomSearchDto } from './dto/room-search.dto';
import { ReceiveMessageDto } from './dto/receive-message.dto';
import { Role } from 'src/auth/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { CurrentUser } from 'src/common/decorators/user.decorator';

@Controller('rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.User)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomService.create(createRoomDto);
  }

  @Get()
  findAll(@CurrentUser() user, @Query() requestData: RoomSearchDto) {
    return this.roomService.findAll(user.id, requestData);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query() requestData: RoomSearchDto) {
    return this.roomService.findOne(id, requestData);
  }

  @Post('receive-message')
  receiveMessage(@Body() requestData: ReceiveMessageDto) {
    return this.roomService.receiveMessage(requestData);
  }
}
