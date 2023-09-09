import {
  Body,
  Controller,
  HttpCode,
  Post,
  UseGuards,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { JwtRefreshTokenGuard } from './refresh.guard';
import { CurrentUser } from 'src/common/decorators/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() requestData: LoginDto) {
    return this.authService.login(requestData);
  }

  @Post('register')
  @HttpCode(200)
  register(@Body() requestData: CreateUserDto) {
    return this.authService.register(requestData);
  }

  @UseGuards(JwtRefreshTokenGuard)
  @Get('refresh-token')
  async refreshToken(@CurrentUser() user) {
    const result = await this.authService.refreshToken(user.id);
    return result;
  }
}
