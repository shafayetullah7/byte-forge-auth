import { Module } from '@nestjs/common';
import { CartModule } from '@/modules/cart/cart.module';
import { ReviewModule } from '@/modules/review/review.module';
import { UserAddressRepositoryModule } from '@/_repositories/user/user-address.repository/user-address.repository.module';
import { OrderCartIntegration } from './order-cart.integration';
import { OrderReviewIntegration } from './order-review.integration';
import { OrderUserAddressIntegration } from './order-user-address.integration';

@Module({
  imports: [CartModule, UserAddressRepositoryModule, ReviewModule],
  providers: [
    OrderCartIntegration,
    OrderUserAddressIntegration,
    OrderReviewIntegration,
  ],
  exports: [
    OrderCartIntegration,
    OrderUserAddressIntegration,
    OrderReviewIntegration,
  ],
})
export class OrderIntegrationsModule {}
