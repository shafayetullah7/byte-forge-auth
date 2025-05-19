import { Module } from '@nestjs/common';
import { UserSessionService } from './user-session.service';
import { UserSessionController } from './user-session.controller';

@Module({
  controllers: [UserSessionController],
  providers: [UserSessionService],
})
export class UserSessionModule {}
