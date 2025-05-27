import { Module } from '@nestjs/common';
import { DrizzleModule } from './drizzle/drizzle.module';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { HttpExceptionFilter } from './common/exception-filters/http.exception.filter';
import { ZodValidationPipe } from './common/pipes/zod.validation.pipe';
import { UserAuthModule } from './api/user-auth/user-auth.module';
import { UserModule } from './api/user/user.module';
import { HashingModule } from './common/modules/hashing/hashing.module';
import { UserSessionModule } from './api/user-session/user-session.module';
import { CookieModule } from './common/modules/cookie/cookie.module';
import { ResponseModule } from './common/modules/response/response.module';
import { ZodExceptionFilter } from './common/exception-filters/zod.exception.filter';
import { DrizzleExceptionFilter } from './common/exception-filters/drizzle.exception.filter';

@Module({
  imports: [
    DrizzleModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      load: [configuration],
      expandVariables: true,
    }),
    UserAuthModule,
    UserModule,
    HashingModule,
    UserSessionModule,
    CookieModule,
    ResponseModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ZodExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DrizzleExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
