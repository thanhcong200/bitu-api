import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/schemas/User.schema';
import { ApiError } from 'src/common/api';
import { ErrorCode, USER_AVATARS } from 'src/common/constants';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private SALT_ROUND = 11;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  /**
   * Login
   * @param {LoginDto} requestData
   * @return {any} user information
   */
  async login(requestData: LoginDto) {
    const user = await this.userModel
      .findOne({
        username: requestData.username.trim(),
      })
      .lean();
    if (!user) throw new UnauthorizedException('User invalid');
    const isValidPassword = await bcrypt.compare(
      requestData.password,
      user.password,
    );
    if (!isValidPassword) throw new UnauthorizedException('User invalid');
    const payload = {
      id: user._id,
      username: requestData.username,
      role: user.role,
    };
    console.log(payload);
    const tokens = await this.generateToken(payload);
    return {
      id: user._id,
      username: user.username,
      role: user.role,
      ...tokens,
    };
  }

  async register(requestData: CreateUserDto) {
    const existUser = await this.userModel
      .findOne({
        username: requestData.username.trim(),
      })
      .lean();
    if (existUser) throw ApiError(ErrorCode.INVALID_DATA, `Username is exists`);
    const hashedPassword = await bcrypt.hash(
      requestData.password,
      this.SALT_ROUND,
    );
    const indexAvatar = Math.floor(Math.random() * USER_AVATARS.length);
    const avatar = USER_AVATARS[indexAvatar];
    const createdUser = new this.userModel({
      username: requestData.username.trim(),
      password: hashedPassword,
      avatar,
    });
    return createdUser.save();
  }

  async refreshToken(id: string) {
    const user = await this.userModel.findById(id).lean();
    const payload = { id, username: user.username, role: user.role };
    return this.generateToken(payload);
  }

  async generateToken(payload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRATION_TIME,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRATION_TIME,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
