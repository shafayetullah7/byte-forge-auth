import { Global, Module } from '@nestjs/common';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminSessionModule } from '@/api/admin/admin-session/admin-session.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { AdminAuthModule } from '@/api/admin/admin-auth/admin-auth.module';

@Global()
@Module({
  imports: [AdminSessionModule, AuthModule, AdminAuthModule],
  providers: [AdminAuthGuard],
  exports: [AdminAuthGuard, AuthModule, AdminAuthModule, AdminSessionModule],
})
export class AdminAuthGuardModule {}
