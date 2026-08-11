import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ListProductsService } from './services/list-products.service';
import { GetProductByIdService } from './services/get-product-by-id.service';
import { GetProductSummaryService } from './services/get-product-summary.service';
import { GetProductOverviewService } from './services/get-product-overview.service';
import { VerifiedUserAuthGuardModule } from '@/common/guards/verified-user-auth-guard/verified-user-auth.guard.module';
import { ShopModule } from '@/modules/shop/shop.module';

@Module({
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ListProductsService,
    GetProductByIdService,
    GetProductSummaryService,
    GetProductOverviewService,
  ],
  imports: [VerifiedUserAuthGuardModule, ShopModule],
})
export class ProductsModule {}
