import { CacheModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RedisClientOptions } from 'redis';
import * as redisStore from 'cache-manager-redis-store';
import { ScheduleModule } from '@nestjs/schedule';
import { SocketModule } from './providers/socket/socket.module';
import { RoomModule } from './room/room.module';
import { CommonModule } from './common-service/common-service.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      ttl: Number(process.env.REDIS_TTL),
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    CommonModule,
    SocketModule,
    AuthModule,
    UsersModule,
    RoomModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
