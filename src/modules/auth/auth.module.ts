import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { UserModule } from '@/modules/user/user.module';
import { CookieModule } from '@/libs/modules/cookie/cookie.module';
import { EventsModule } from '@/libs/modules/events/events.module';
import { HashingModule } from '@/libs/modules/hashing/hashing.module';
import { OtpModule } from '@/libs/modules/otp/otp.module';
import { AppConfigModule } from '@/libs/modules/app-config/app-config.module';
import {
  AdminAuthService,
  AdminLocalAuthService,
  AdminService,
  AdminSessionService,
  PasswordResetService,
  UserAuthService,
  UserAuthV2Service,
  UserLocalAuthService,
} from './application';
import {
  AdminAuthController,
  AdminProfileController,
  AdminSessionController,
  PasswordResetController,
  UserAuthController,
} from './controllers';
import {
  AdminLocalAuthRepository,
  AdminSessionRepository,
  SessionRepository,
  UserLocalAuthRepository,
  UserSessionRepository,
} from './repositories';

@Module({
  imports: [
    DrizzleModule,
    HashingModule,
    forwardRef(() => UserModule),
    CookieModule,
    OtpModule,
    EventsModule,
    AppConfigModule,
    JwtModule.register({}),
  ],
  controllers: [
    UserAuthController,
    PasswordResetController,
    AdminAuthController,
    AdminProfileController,
    AdminSessionController,
  ],
  providers: [
    UserSessionRepository,
    SessionRepository,
    UserLocalAuthRepository,
    AdminSessionRepository,
    AdminLocalAuthRepository,
    UserAuthService,
    UserLocalAuthService,
    UserAuthV2Service,
    PasswordResetService,
    AdminAuthService,
    AdminLocalAuthService,
    AdminService,
    AdminSessionService,
  ],
  exports: [
    UserSessionRepository,
    SessionRepository,
    UserLocalAuthRepository,
    UserAuthV2Service,
    AdminAuthService,
    AdminSessionService,
  ],
})
export class AuthModule {}
