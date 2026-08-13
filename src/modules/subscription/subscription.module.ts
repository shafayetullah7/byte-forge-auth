import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { CheckSellerSubscriptionQuery } from './application/queries';
import {
  ShopSubscriptionRepository,
  SubscriptionCouponRepository,
  SubscriptionInvoiceRepository,
  SubscriptionPlanRepository,
} from './repositories';

/**
 * Seller platform billing (subscription plans, coupons, Stripe).
 * Buyer order payments remain in PaymentModule.
 *
 * HTTP controllers and application services are added in later phases.
 */
@Module({
  imports: [DrizzleModule],
  controllers: [],
  providers: [
    SubscriptionPlanRepository,
    ShopSubscriptionRepository,
    SubscriptionCouponRepository,
    SubscriptionInvoiceRepository,
    CheckSellerSubscriptionQuery,
  ],
  exports: [CheckSellerSubscriptionQuery],
})
export class SubscriptionModule {}
