import { Global, Module } from '@nestjs/common';
import { CartAccessGuard } from './cart-access.guard';
import { AuthModule } from '@/modules/auth/auth.module';

@Global()
@Module({
  imports: [AuthModule],
  providers: [CartAccessGuard],
  exports: [CartAccessGuard, AuthModule],
})
export class CartAccessGuardModule {}
