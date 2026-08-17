import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { UserModule } from '@/modules/user/user.module';
import { CookieModule } from '@/libs/modules/cookie/cookie.module';
import { EventsModule } from '@/libs/modules/events/events.module';
import { HashingModule } from '@/libs/modules/hashing/hashing.module';
import { OtpModule } from '@/libs/modules/otp/otp.module';
import { AppConfigModule } from '@/libs/modules/app-config/app-config.module';
import { JwtResourceGuardModule } from '@/libs/auth/jwt-resource.guard.module';
import {
  AdminAuthService,
  AdminLocalAuthService,
  AdminRegistrationService,
  AdminRegistrationRateLimiterService,
  AdminService,
  AdminSessionService,
  OidcIdentityProvisionerService,
  OidcAuthService,
} from './application';
import {
  AdminAuthController,
  AdminProfileController,
  AdminSessionController,
  UserAuthController,
  UserOidcController,
} from './controllers';
import {
  AdminLocalAuthRepository,
  AdminRegistrationPendingRepository,
  AdminRegistrationRateLimitRepository,
  AdminSessionRepository,
  SessionRepository,
  UserIdentityRepository,
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
    JwtResourceGuardModule,
    JwtModule.register({}),
  ],
  controllers: [
    UserAuthController,
    UserOidcController,
    AdminAuthController,
    AdminProfileController,
    AdminSessionController,
  ],
  providers: [
    SessionRepository,
    UserIdentityRepository,
    AdminSessionRepository,
    AdminLocalAuthRepository,
    AdminRegistrationPendingRepository,
    AdminRegistrationRateLimitRepository,
    AdminAuthService,
    AdminLocalAuthService,
    AdminRegistrationService,
    AdminRegistrationRateLimiterService,
    AdminService,
    AdminSessionService,
    OidcIdentityProvisionerService,
    OidcAuthService,
  ],
  exports: [
    SessionRepository,
    AdminAuthService,
    AdminSessionService,
    OidcIdentityProvisionerService,
  ],
})
export class AuthModule {}
