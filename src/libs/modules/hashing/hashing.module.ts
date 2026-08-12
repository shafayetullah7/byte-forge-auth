import { Global, Module } from '@nestjs/common';
import { HashingService } from './hashing.service';

@Global()
@Module({
  controllers: [],
  providers: [HashingService],
  exports: [HashingService],
})
export class HashingModule {}
