import { Global, Module } from '@nestjs/common';
import { UserSessionService } from './user-session.service';
import { UserSessionController } from './user-session.controller';
import { SessionModule } from 'src/api/session/session.module';

@Global()
@Module({
  imports: [SessionModule],
  controllers: [UserSessionController],
  providers: [UserSessionService],
  exports: [UserSessionService],
})
export class UserSessionModule {}
