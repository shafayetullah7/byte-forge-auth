import { Module } from '@nestjs/common';
import { ShippingRatesController } from './shipping-rates.controller';
import { ShippingRatesService } from './shipping-rates.service';
import { GetShippingRatesService } from './services/get-shipping-rates.service';
import { ShopModule } from '@/modules/shop/shop.module';
import { ShopShippingRatesRepositoryModule } from '@/_repositories/business/shop.shipping-rates.repository/shop.shipping-rates.repository.module';
import { VerifiedUserAuthGuardModule } from '@/common/guards/verified-user-auth-guard/verified-user-auth.guard.module';

@Module({
  controllers: [ShippingRatesController],
  providers: [GetShippingRatesService, ShippingRatesService],
  imports: [
    ShopModule,
    ShopShippingRatesRepositoryModule,
    VerifiedUserAuthGuardModule,
  ],
})
export class ShippingRatesModule {}
