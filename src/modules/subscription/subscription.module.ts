import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { StripeGatewayModule } from '@/libs/gateways/stripe/stripe-gateway.module';
import {
  CreateSubscriptionPlanCommand,
  RetireSubscriptionPlanCommand,
  SyncPlanToStripeCommand,
  UpdateSubscriptionPlanCommand,
} from './application/commands';
import {
  CheckSellerSubscriptionQuery,
  GetSubscriptionPlanQuery,
  ListAvailableSubscriptionPlansQuery,
  ListSubscriptionPlansQuery,
} from './application/queries';
import { AdminSubscriptionPlansController } from './controllers';
import {
  ShopSubscriptionRepository,
  SubscriptionCouponRepository,
  SubscriptionInvoiceRepository,
  SubscriptionPlanRepository,
} from './repositories';

/**
 * Seller platform billing (subscription plans, coupons, Stripe).
 * Buyer order payments remain in PaymentModule.
 */
@Module({
  imports: [DrizzleModule, StripeGatewayModule],
  controllers: [AdminSubscriptionPlansController],
  providers: [
    SubscriptionPlanRepository,
    ShopSubscriptionRepository,
    SubscriptionCouponRepository,
    SubscriptionInvoiceRepository,
    CheckSellerSubscriptionQuery,
    ListSubscriptionPlansQuery,
    ListAvailableSubscriptionPlansQuery,
    GetSubscriptionPlanQuery,
    CreateSubscriptionPlanCommand,
    UpdateSubscriptionPlanCommand,
    RetireSubscriptionPlanCommand,
    SyncPlanToStripeCommand,
  ],
  exports: [CheckSellerSubscriptionQuery, ListAvailableSubscriptionPlansQuery],
})
export class SubscriptionModule {}
