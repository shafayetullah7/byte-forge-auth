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
import { OidcOrSessionGuard } from '@/libs/guards/oidc-or-session-guard/oidc-or-session.guard';
import {
  AdminAuthService,
  AdminLocalAuthService,
  AdminOidcResolverService,
  AdminRegistrationService,
  AdminRegistrationRateLimiterService,
  AdminService,
  AdminSessionService,
  OidcIdentityProvisionerService,
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
  AdminRegistrationPendingRepository,
  AdminRegistrationRateLimitRepository,
  AdminSessionRepository,
  SessionRepository,
  UserLocalAuthRepository,
  UserSessionRepository,
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
    PasswordResetController,
    AdminAuthController,
    AdminProfileController,
    AdminSessionController,
  ],
  providers: [
    UserSessionRepository,
    SessionRepository,
    UserLocalAuthRepository,
    UserIdentityRepository,
    AdminSessionRepository,
    AdminLocalAuthRepository,
    AdminRegistrationPendingRepository,
    AdminRegistrationRateLimitRepository,
    UserAuthService,
    UserLocalAuthService,
    UserAuthV2Service,
    PasswordResetService,
    AdminAuthService,
    AdminLocalAuthService,
    AdminRegistrationService,
    AdminRegistrationRateLimiterService,
    AdminService,
    AdminSessionService,
    OidcIdentityProvisionerService,
    AdminOidcResolverService,
    OidcOrSessionGuard,
  ],
  exports: [
    UserSessionRepository,
    SessionRepository,
    UserLocalAuthRepository,
    UserAuthV2Service,
    AdminAuthService,
    AdminSessionService,
    OidcIdentityProvisionerService,
    AdminOidcResolverService,
    OidcOrSessionGuard,
  ],
})
export class AuthModule {}
