import { Module } from '@nestjs/common';
import { CommonService } from './common-service.service';

@Module({
  imports: [],
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}
