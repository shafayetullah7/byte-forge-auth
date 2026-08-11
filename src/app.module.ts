import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DrizzleModule } from './_db/drizzle/drizzle.module';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import * as path from 'path';
import { ConfigModule } from '@nestjs/config';
import configuration from './_config/configuration';
import { envSchema } from './_config/env.schema';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { UserApiModule } from './api/user/user-api.module';
import { HashingModule } from './common/modules/hashing/hashing.module';
import { CookieModule } from './common/modules/cookie/cookie.module';
import { ResponseModule } from './common/modules/response/response.module';
import { PublicApiModule } from './api/public/public.module';
import { AdminApiModule } from './api/admin/admin-api.module';

import { EmailModule } from './common/modules/email/email.module';
import { AppConfigModule } from './common/modules/app-config/app-config.module';
import { AllExceptionsFilter } from './common/exception-filters/all.exception.filter';
import { ZodValidationPipe } from 'nestjs-zod';
import { MediaModule } from './api/media/media.module';
import { CloudinaryModule } from './common/modules/cloudinary/cloudinary.module';
import { LoggerModule } from './common/modules/logger/logger.module';
import { UserAuthGuardModule } from './common/guards/user-auth-guard/user-auth-guard.module';
import { UserAuthJWtGuardModule } from './common/guards/user-auth-jwt-guard/user-auth-jwt-guard.module';
import { VerifiedUserAuthGuardModule } from './common/guards/verified-user-auth-guard/verified-user-auth.guard.module';
import { AdminAuthGuardModule } from './common/guards/admin-auth-guard/admin-auth-guard.module';
import { CartAccessGuardModule } from './common/guards/cart-access-guard/cart-access-guard.module';
import { EventsModule } from './common/modules/events/events.module';
import { NotificationsModule } from './common/modules/notifications/notifications.module';

import { AppEnvModule } from './_config/app-env/app-env.module';
import { JwtModule } from '@nestjs/jwt';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import morgan = require('morgan');
import { GuestTokenMiddleware } from './common/middleware/guest-token.middleware';
import { HealthModule } from './common/modules/health/health.module';
import { OrderModule } from './modules/order/order.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CartModule } from './modules/cart/cart.module';
import { PaymentModule } from './modules/payment/payment.module';

@Module({
  imports: [
    JwtModule.register({ global: true }),
    DrizzleModule,
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        new HeaderResolver(['x-locale']), // Read x-locale header from frontend
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      load: [configuration],
      validate: (config) => envSchema.parse(config),
      expandVariables: true,
    }),
    UserApiModule,
    AdminApiModule,
    PublicApiModule,
    MediaModule,
    HashingModule,
    CookieModule,
    ResponseModule,
    EmailModule,
    AppConfigModule,
    CloudinaryModule,
    LoggerModule,
    UserAuthGuardModule,
    UserAuthJWtGuardModule,
    VerifiedUserAuthGuardModule,
    AdminAuthGuardModule,
    CartAccessGuardModule,
    EventsModule,
    NotificationsModule,
    AppEnvModule,
    HealthModule,
    OrderModule,
    InventoryModule,
    CartModule,
    PaymentModule,
  ],
  controllers: [],
  providers: [
    GuestTokenMiddleware,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // {
    //   provide: APP_FILTER,
    //   useClass: HttpExceptionFilter,
    // },
    // {
    //   provide: APP_FILTER,
    //   useClass: ZodExceptionFilter,
    // },
    // {
    //   provide: APP_FILTER,
    //   useClass: DrizzleExceptionFilter,
    // },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(GuestTokenMiddleware).forRoutes('*path');

    consumer
      .apply(
        morgan(
          ':date[iso] :method :url :status :response-time ms - :res[content-length]',
          {
            // Skip logging successful responses in production to reduce noise
            skip: (req, res) => {
              if (process.env.NODE_ENV === 'production') {
                return res.statusCode < 400; // Only log errors in production
              }
              return false; // Log everything in development
            },
          },
        ),
      )
      .forRoutes('*path');
  }
}
