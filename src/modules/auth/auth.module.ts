import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { UserRepositoryModule } from '@/_repositories/user/user.repository/user.repository.module';
import { UserModule } from '@/api/user/user/user.module';
import { CookieModule } from '@/common/modules/cookie/cookie.module';
import { EventsModule } from '@/common/modules/events/events.module';
import { HashingModule } from '@/common/modules/hashing/hashing.module';
import { OtpModule } from '@/common/modules/otp/otp.module';
import { AppConfigModule } from '@/common/modules/app-config/app-config.module';
import {
  PasswordResetService,
  UserAuthService,
  UserAuthV2Service,
  UserLocalAuthService,
} from './application';
import { PasswordResetController, UserAuthController } from './controllers';
import {
  SessionRepository,
  UserLocalAuthRepository,
  UserSessionRepository,
} from './repositories';

@Module({
  imports: [
    DrizzleModule,
    HashingModule,
    UserModule,
    CookieModule,
    OtpModule,
    UserRepositoryModule,
    EventsModule,
    AppConfigModule,
    JwtModule.register({}),
  ],
  controllers: [UserAuthController, PasswordResetController],
  providers: [
    UserSessionRepository,
    SessionRepository,
    UserLocalAuthRepository,
    UserAuthService,
    UserLocalAuthService,
    UserAuthV2Service,
    PasswordResetService,
  ],
  exports: [
    UserSessionRepository,
    SessionRepository,
    UserLocalAuthRepository,
    UserAuthV2Service,
  ],
})
export class AuthModule {}
