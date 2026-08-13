import { Module } from '@nestjs/common';
import { AppEnvModule } from '@/_config/app-env/app-env.module';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { StripeGatewayModule } from '@/libs/gateways/stripe/stripe-gateway.module';
import {
  CreateSellerSubscriptionCheckoutCommand,
  CreateSubscriptionCouponCommand,
  CreateSubscriptionPlanCommand,
  DeactivateSubscriptionCouponCommand,
  ExtendShopSubscriptionCommand,
  ProcessStripeSubscriptionWebhookCommand,
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
  ListSellerSubscriptionInvoicesQuery,
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
  StripeSubscriptionWebhookController,
} from './controllers';
import {
  CheckoutSessionCompletedHandler,
  CustomerSubscriptionDeletedHandler,
  CustomerSubscriptionUpdatedHandler,
  InvoicePaidHandler,
} from './infrastructure/stripe/webhook-handlers';
import { StripeSubscriptionWebhookContextService } from './infrastructure/stripe/stripe-subscription-webhook-context.service';
import { StripeSubscriptionProvider } from './infrastructure/providers';
import {
  ShopSubscriptionRepository,
  SubscriptionCouponRepository,
  SubscriptionInvoiceRepository,
  SubscriptionPlanRepository,
  SubscriptionStripeWebhookEventRepository,
} from './repositories';

/**
 * Seller platform billing (subscription plans, coupons, Stripe).
 * Buyer order payments remain in PaymentModule.
 */
@Module({
  imports: [DrizzleModule, StripeGatewayModule, AppEnvModule],
  controllers: [
    AdminSubscriptionPlansController,
    AdminSubscriptionCouponsController,
    AdminShopSubscriptionController,
    SellerSubscriptionController,
    StripeSubscriptionWebhookController,
  ],
  providers: [
    SubscriptionPlanRepository,
    ShopSubscriptionRepository,
    SubscriptionCouponRepository,
    SubscriptionInvoiceRepository,
    SubscriptionStripeWebhookEventRepository,
    CheckSellerSubscriptionQuery,
    ListSubscriptionPlansQuery,
    ListAvailableSubscriptionPlansQuery,
    GetSubscriptionPlanQuery,
    ListSubscriptionCouponsQuery,
    GetSubscriptionCouponQuery,
    GetAdminShopSubscriptionQuery,
    GetSellerSubscriptionQuery,
    ListSellerSubscriptionInvoicesQuery,
    CreateSubscriptionPlanCommand,
    UpdateSubscriptionPlanCommand,
    RetireSubscriptionPlanCommand,
    SyncPlanToStripeCommand,
    CreateSubscriptionCouponCommand,
    UpdateSubscriptionCouponCommand,
    DeactivateSubscriptionCouponCommand,
    ExtendShopSubscriptionCommand,
    RedeemSubscriptionCouponCommand,
    CreateSellerSubscriptionCheckoutCommand,
    StripeSubscriptionProvider,
    StripeSubscriptionWebhookContextService,
    CheckoutSessionCompletedHandler,
    InvoicePaidHandler,
    CustomerSubscriptionUpdatedHandler,
    CustomerSubscriptionDeletedHandler,
    ProcessStripeSubscriptionWebhookCommand,
  ],
  exports: [CheckSellerSubscriptionQuery, ListAvailableSubscriptionPlansQuery],
})
export class SubscriptionModule {}
