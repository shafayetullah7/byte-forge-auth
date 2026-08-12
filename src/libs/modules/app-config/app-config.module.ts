import { Global, Module } from '@nestjs/common';
import { AppConfigService } from './app-config.service';

@Global()
@Module({
  controllers: [],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
