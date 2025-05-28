import { Module } from '@nestjs/common';
import { UserAuthService } from './user-auth.service';
import { UserAuthController } from './user-auth.controller';
import { UserLocalAuthService } from './user-local-auth.service';
import { HashingModule } from 'src/common/modules/hashing/hashing.module';
import { UserSessionModule } from '../user-session/user-session.module';
import { UserModule } from '../user/user.module';
import { LocalStrategy } from './strategies/local.strategy';
import { CookieModule } from 'src/common/modules/cookie/cookie.module';

@Module({
  imports: [
    HashingModule,
    UserModule,
    UserSessionModule,
    HashingModule,
    CookieModule,
  ],
  controllers: [UserAuthController],
  providers: [UserAuthService, UserLocalAuthService, LocalStrategy],
})
export class UserAuthModule {}
