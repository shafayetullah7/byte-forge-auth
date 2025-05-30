import { Module } from '@nestjs/common';
import { AdminSessionService } from './admin-session.service';
import { AdminSessionController } from './admin-session.controller';
import { SessionModule } from 'src/api/session/session.module';

@Module({
  imports: [SessionModule],
  controllers: [AdminSessionController],
  providers: [AdminSessionService],
  exports: [AdminSessionService],
})
export class AdminSessionModule {}
