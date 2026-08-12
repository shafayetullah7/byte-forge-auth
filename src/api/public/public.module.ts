import { Module } from '@nestjs/common';
import { PublicLocationModule } from './location/location.module';

@Module({
  imports: [PublicLocationModule],
  exports: [PublicLocationModule],
})
export class PublicApiModule {}
