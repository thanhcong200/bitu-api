import {
  Injectable,
  Inject,
  OnModuleInit,
  Logger,
  CACHE_MANAGER,
} from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CommonService implements OnModuleInit {
  private readonly logger = new Logger(CommonService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async onModuleInit() {}

  async setCache(key: string, data: any) {
    try {
      await this.cacheManager.set(key, data);
    } catch (error) {
      this.logger.warn(`setCache(): error`, error);
    }
  }

  getCache(key: string) {
    return this.cacheManager.get(key) as any;
  }
}
