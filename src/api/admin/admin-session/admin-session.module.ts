import { Module } from '@nestjs/common';
import { AdminSessionService } from './admin-session.service';
import { AdminSessionController } from './admin-session.controller';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AdminSessionController],
  providers: [AdminSessionService],
  exports: [AdminSessionService],
})
export class AdminSessionModule {}
