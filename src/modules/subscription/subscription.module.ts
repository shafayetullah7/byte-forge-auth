import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { StripeGatewayModule } from '@/libs/gateways/stripe/stripe-gateway.module';
import {
  CreateSubscriptionCouponCommand,
  CreateSubscriptionPlanCommand,
  DeactivateSubscriptionCouponCommand,
  ExtendShopSubscriptionCommand,
  RedeemSubscriptionCouponCommand,
  RetireSubscriptionPlanCommand,
  SyncPlanToStripeCommand,
  UpdateSubscriptionCouponCommand,
  UpdateSubscriptionPlanCommand,
} from './application/commands';
import {
  CheckSellerSubscriptionQuery,
  GetAdminShopSubscriptionQuery,
  GetSellerSubscriptionQuery,
  GetSubscriptionCouponQuery,
  GetSubscriptionPlanQuery,
  ListAvailableSubscriptionPlansQuery,
  ListSubscriptionCouponsQuery,
  ListSubscriptionPlansQuery,
} from './application/queries';
import {
  AdminShopSubscriptionController,
  AdminSubscriptionCouponsController,
  AdminSubscriptionPlansController,
  SellerSubscriptionController,
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
    AdminShopSubscriptionController,
    SellerSubscriptionController,
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
    GetAdminShopSubscriptionQuery,
    GetSellerSubscriptionQuery,
    CreateSubscriptionPlanCommand,
    UpdateSubscriptionPlanCommand,
    RetireSubscriptionPlanCommand,
    SyncPlanToStripeCommand,
    CreateSubscriptionCouponCommand,
    UpdateSubscriptionCouponCommand,
    DeactivateSubscriptionCouponCommand,
    ExtendShopSubscriptionCommand,
    RedeemSubscriptionCouponCommand,
  ],
  exports: [CheckSellerSubscriptionQuery, ListAvailableSubscriptionPlansQuery],
})
export class SubscriptionModule {}
