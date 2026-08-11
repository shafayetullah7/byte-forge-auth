import { Global, Module } from '@nestjs/common';
import { VerifiedUserAuthGuard } from './verified-user-auth.guard';
import { UserAuthGuardModule } from '../user-auth-guard/user-auth-guard.module';
import { EmailVerifiedGuardModule } from '../email-verified-guard/email-verified.guard.module';
import { ShopModule } from '@/modules/shop/shop.module';

@Global()
@Module({
  imports: [UserAuthGuardModule, EmailVerifiedGuardModule, ShopModule],
  providers: [VerifiedUserAuthGuard],
  exports: [VerifiedUserAuthGuard, EmailVerifiedGuardModule, ShopModule],
})
export class VerifiedUserAuthGuardModule {}
