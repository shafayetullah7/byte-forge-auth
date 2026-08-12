import { Global, Module } from '@nestjs/common';
import { CookieService } from './cookie.service';

@Global()
@Module({
  controllers: [],
  providers: [CookieService],
  exports: [CookieService],
})
export class CookieModule {}
