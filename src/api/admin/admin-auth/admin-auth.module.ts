import { Module } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminModule } from '../admin/admin.module';
import { AdminLocalAuthService } from './admin-local-auth.service';
import { AdminSessionModule } from '../admin-session/admin-session.module';

@Module({
  imports: [AdminModule, AdminSessionModule],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminLocalAuthService],
})
export class AdminAuthModule {}
