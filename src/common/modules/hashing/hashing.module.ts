import { Module } from '@nestjs/common';
import { HashingService } from './hashing.service';

@Module({
  controllers: [],
  providers: [HashingService],
})
export class HashingModule {}
