import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { PaymentMethodRepositoryModule } from '@/_repositories/payment/payment-method.repository/payment-method.repository.module';
import { ReviewRepositoryModule } from '@/_repositories/review/review.repository/review.repository.module';
import { CartRepositoryModule } from '@/_repositories/user/cart.repository/cart.repository.module';
import { UserAddressRepositoryModule } from '@/_repositories/user/user-address.repository/user-address.repository.module';
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
import { BuyerCheckoutController, BuyerOrdersController } from './controllers';
import { OrderRepository } from './repositories/order.repository';

@Module({
  imports: [
    DrizzleModule,
    ReviewRepositoryModule,
    InventoryModule,
    CartRepositoryModule,
    UserAddressRepositoryModule,
    PaymentMethodRepositoryModule,
  ],
  controllers: [BuyerOrdersController, BuyerCheckoutController],
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
