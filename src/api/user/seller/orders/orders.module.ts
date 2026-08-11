import { Module } from '@nestjs/common';
import { SellerOrdersController } from './orders.controller';
import { GetSellerOrdersService } from './services/get-seller-orders.service';
import { GetSellerOrderStatsService } from './services/get-seller-order-stats.service';
import { GetSellerOrderService } from './services/get-seller-order.service';
import { UpdateSellerOrderStatusService } from './services/update-seller-order-status.service';
import { ShipSellerOrderService } from './services/ship-seller-order.service';
import { CancelSellerOrderService } from './services/cancel-seller-order.service';
import { OrderModule } from '@/modules/order/order.module';
import { VerifiedUserAuthGuardModule } from '@/common/guards/verified-user-auth-guard/verified-user-auth.guard.module';
import { SellerShopGuardModule } from '@/common/guards/seller-shop-guard/seller-shop.guard.module';

@Module({
  controllers: [SellerOrdersController],
  providers: [
    GetSellerOrdersService,
    GetSellerOrderStatsService,
    GetSellerOrderService,
    UpdateSellerOrderStatusService,
    ShipSellerOrderService,
    CancelSellerOrderService,
  ],
  imports: [OrderModule, VerifiedUserAuthGuardModule, SellerShopGuardModule],
})
export class SellerOrdersModule {}
