import { Global, Module } from '@nestjs/common';
import { CartAccessGuard } from './cart-access.guard';
import { AuthModule } from '@/modules/auth/auth.module';
import { JwtResourceGuardModule } from '@/libs/auth/jwt-resource.guard.module';

@Global()
@Module({
  imports: [AuthModule, JwtResourceGuardModule],
  providers: [CartAccessGuard],
  exports: [CartAccessGuard, AuthModule],
})
export class CartAccessGuardModule {}
