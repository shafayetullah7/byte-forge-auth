import { Global, Module } from '@nestjs/common';
import { UserSessionService } from './user-session.service';
import { UserSessionController } from './user-session.controller';

@Global()
@Module({
  controllers: [UserSessionController],
  providers: [UserSessionService],
  exports: [UserSessionService],
})
export class UserSessionModule {}
