import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { StripeGatewayModule } from '@/libs/gateways/stripe/stripe-gateway.module';
import {
  CreateSubscriptionCouponCommand,
  CreateSubscriptionPlanCommand,
  DeactivateSubscriptionCouponCommand,
  RetireSubscriptionPlanCommand,
  SyncPlanToStripeCommand,
  UpdateSubscriptionCouponCommand,
  UpdateSubscriptionPlanCommand,
} from './application/commands';
import {
  CheckSellerSubscriptionQuery,
  GetSubscriptionCouponQuery,
  GetSubscriptionPlanQuery,
  ListAvailableSubscriptionPlansQuery,
  ListSubscriptionCouponsQuery,
  ListSubscriptionPlansQuery,
} from './application/queries';
import {
  AdminSubscriptionCouponsController,
  AdminSubscriptionPlansController,
} from './controllers';
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
  controllers: [
    AdminSubscriptionPlansController,
    AdminSubscriptionCouponsController,
  ],
  providers: [
    SubscriptionPlanRepository,
    ShopSubscriptionRepository,
    SubscriptionCouponRepository,
    SubscriptionInvoiceRepository,
    CheckSellerSubscriptionQuery,
    ListSubscriptionPlansQuery,
    ListAvailableSubscriptionPlansQuery,
    GetSubscriptionPlanQuery,
    ListSubscriptionCouponsQuery,
    GetSubscriptionCouponQuery,
    CreateSubscriptionPlanCommand,
    UpdateSubscriptionPlanCommand,
    RetireSubscriptionPlanCommand,
    SyncPlanToStripeCommand,
    CreateSubscriptionCouponCommand,
    UpdateSubscriptionCouponCommand,
    DeactivateSubscriptionCouponCommand,
  ],
  exports: [CheckSellerSubscriptionQuery, ListAvailableSubscriptionPlansQuery],
})
export class SubscriptionModule {}
