import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { ReviewRepositoryModule } from '@/_repositories/review/review.repository/review.repository.module';
import { InventoryModule } from '@/modules/inventory/inventory.module';
import {
  CancelBuyerOrderCommand,
  ConfirmDeliveryCommand,
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
 * Legacy order HTTP still under `src/api/**` — reads delegate to queries; buyer
 * cancel/confirm delegate to commands here.
 */
@Module({
  imports: [DrizzleModule, ReviewRepositoryModule, InventoryModule],
  controllers: [],
  providers: [
    OrderRepository,
    CancelBuyerOrderCommand,
    ConfirmDeliveryCommand,
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
    ConfirmDeliveryCommand,
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
