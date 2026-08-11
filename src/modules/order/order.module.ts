import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { ReviewRepositoryModule } from '@/_repositories/review/review.repository/review.repository.module';
import { InventoryModule } from '@/modules/inventory/inventory.module';
import {
  CancelBuyerOrderCommand,
  CancelSellerOrderCommand,
  ConfirmDeliveryCommand,
  ShipSellerOrderCommand,
  UpdateSellerOrderStatusCommand,
} from './application/commands';
import {
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
import { OrderRepository } from './repositories/order.repository';

/**
 * Order domain module. Controllers migrate in Phases 9–10.
 * Legacy order HTTP still under `src/api/**` — reads delegate to queries; buyer/seller
 * mutations delegate to commands here.
 */
@Module({
  imports: [DrizzleModule, ReviewRepositoryModule, InventoryModule],
  controllers: [],
  providers: [
    OrderRepository,
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
