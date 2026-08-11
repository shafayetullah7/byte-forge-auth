import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { PaymentMethodRepositoryModule } from '@/_repositories/payment/payment-method.repository/payment-method.repository.module';
import { ReviewRepositoryModule } from '@/_repositories/review/review.repository/review.repository.module';
import { CartRepositoryModule } from '@/_repositories/user/cart.repository/cart.repository.module';
import { UserAddressRepositoryModule } from '@/_repositories/user/user-address.repository/user-address.repository.module';
import { AdminAuthGuardModule } from '@/common/guards/admin-auth-guard/admin-auth-guard.module';
import { SellerShopGuardModule } from '@/common/guards/seller-shop-guard/seller-shop.guard.module';
import { VerifiedUserAuthGuardModule } from '@/common/guards/verified-user-auth-guard/verified-user-auth.guard.module';
import { InventoryModule } from '@/modules/inventory/inventory.module';
import {
  CancelBuyerOrderCommand,
  CancelSellerOrderCommand,
  ConfirmDeliveryCommand,
  PlaceOrderCommand,
  ShipSellerOrderCommand,
  UpdateSellerOrderStatusCommand,
} from './application/commands';
import {
  CalculatePriceBreakdownQuery,
  GetAdminOrderQuery,
  GetAdminOrderStatsQuery,
  GetBuyerOrderStatsQuery,
  GetBuyerOrdersQuery,
  GetOrderGroupQuery,
  GetSellerOrderQuery,
  GetSellerOrderStatsQuery,
  ListAdminOrdersQuery,
  ListSellerOrdersQuery,
} from './application/queries';
import { CheckoutPaymentMethodService } from './application/services/checkout-payment-method.service';
import {
  AdminOrdersController,
  BuyerCheckoutController,
  BuyerOrdersController,
  SellerOrdersController,
} from './controllers';
import { OrderRepository } from './repositories/order.repository';

@Module({
  imports: [
    DrizzleModule,
    ReviewRepositoryModule,
    InventoryModule,
    CartRepositoryModule,
    UserAddressRepositoryModule,
    PaymentMethodRepositoryModule,
    VerifiedUserAuthGuardModule,
    SellerShopGuardModule,
    AdminAuthGuardModule,
  ],
  controllers: [
    BuyerOrdersController,
    BuyerCheckoutController,
    SellerOrdersController,
    AdminOrdersController,
  ],
  providers: [
    OrderRepository,
    CheckoutPaymentMethodService,
    CalculatePriceBreakdownQuery,
    PlaceOrderCommand,
    CancelBuyerOrderCommand,
    CancelSellerOrderCommand,
    ConfirmDeliveryCommand,
    ShipSellerOrderCommand,
    UpdateSellerOrderStatusCommand,
    GetBuyerOrdersQuery,
    GetBuyerOrderStatsQuery,
    GetOrderGroupQuery,
    ListSellerOrdersQuery,
    GetSellerOrderQuery,
    GetSellerOrderStatsQuery,
    ListAdminOrdersQuery,
    GetAdminOrderQuery,
    GetAdminOrderStatsQuery,
  ],
  exports: [
    PlaceOrderCommand,
    CancelBuyerOrderCommand,
    CancelSellerOrderCommand,
    ConfirmDeliveryCommand,
    ShipSellerOrderCommand,
    UpdateSellerOrderStatusCommand,
    GetBuyerOrdersQuery,
    GetBuyerOrderStatsQuery,
    GetOrderGroupQuery,
    ListSellerOrdersQuery,
    GetSellerOrderQuery,
    GetSellerOrderStatsQuery,
    ListAdminOrdersQuery,
    GetAdminOrderQuery,
    GetAdminOrderStatsQuery,
  ],
})
export class OrderModule {}
