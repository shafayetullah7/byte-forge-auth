import { forwardRef, Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { OrderIntegrationsModule } from '@/libs/integrations/order';
import { InventoryModule } from '@/modules/inventory/inventory.module';
import { PaymentModule } from '@/modules/payment/payment.module';
import { CatalogModule } from '@/modules/catalog/catalog.module';
import { SubscriptionModule } from '@/modules/subscription/subscription.module';
import { UserModule } from '@/modules/user/user.module';
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
    forwardRef(() => OrderIntegrationsModule),
    PaymentModule,
    InventoryModule,
    CatalogModule,
    SubscriptionModule,
    forwardRef(() => UserModule),
  ],
  controllers: [
    BuyerOrdersController,
    BuyerCheckoutController,
    SellerOrdersController,
    AdminOrdersController,
  ],
  providers: [
    OrderRepository,
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
