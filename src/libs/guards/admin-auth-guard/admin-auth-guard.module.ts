import { Global, Module } from '@nestjs/common';
import { AdminAuthGuard } from './admin-auth.guard';
import { AuthModule } from '@/modules/auth/auth.module';

@Global()
@Module({
  imports: [AuthModule],
  providers: [AdminAuthGuard],
  exports: [AdminAuthGuard, AuthModule],
})
export class AdminAuthGuardModule {}
