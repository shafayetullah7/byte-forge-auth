import { Module } from '@nestjs/common';
import { CartAccessGuard } from './cart-access.guard';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [CartAccessGuard],
  exports: [CartAccessGuard],
})
export class CartAccessGuardModule {}
