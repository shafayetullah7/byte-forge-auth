import { Module } from '@nestjs/common';
import { UserAuthJWtGuard } from './user-auth-jwt.guard';
import { AuthModule } from '@/modules/auth/auth.module';
import { CookieModule } from '@/common/modules/cookie/cookie.module';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigModule } from '@/common/modules/app-config/app-config.module';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';

@Module({
  imports: [
    AuthModule,
    CookieModule,
    JwtModule,
    AppConfigModule,
    DrizzleModule,
  ],
  providers: [UserAuthJWtGuard],
  exports: [UserAuthJWtGuard],
})
export class UserAuthJWtGuardModule {}
