import { Global, Module } from '@nestjs/common';
import { EmailVerifiedGuard } from './email-verified.guard';

@Global()
@Module({
  providers: [EmailVerifiedGuard],
  exports: [EmailVerifiedGuard],
})
export class EmailVerifiedGuardModule {}
