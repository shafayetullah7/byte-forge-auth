import { Global, Module } from '@nestjs/common';
import { AdminAuthGuard } from './admin-auth.guard';
import { AuthModule } from '@/modules/auth/auth.module';
import { JwtResourceGuardModule } from '@/libs/auth/jwt-resource.guard.module';

@Global()
@Module({
  imports: [AuthModule, JwtResourceGuardModule],
  providers: [AdminAuthGuard],
  exports: [AdminAuthGuard, AuthModule, JwtResourceGuardModule],
})
export class AdminAuthGuardModule {}
