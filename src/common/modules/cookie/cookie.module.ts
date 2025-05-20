import { Module } from '@nestjs/common';
import { CookieService } from './cookie.service';

@Module({
  controllers: [],
  providers: [CookieService],
  exports: [CookieService],
})
export class CookieModule {}
