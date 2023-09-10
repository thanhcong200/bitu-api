import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Role } from 'src/auth/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { Query } from '@nestjs/common';
import { SearchUserDto } from './dto/search-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.User)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  findById(@CurrentUser() user) {
    return this.usersService.findById(user.id);
  }

  @Get()
  findAll(@Query() requestData: SearchUserDto) {
    return this.usersService.findAll(requestData);
  }
}
