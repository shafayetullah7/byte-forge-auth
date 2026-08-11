import { Module } from '@nestjs/common';
import { CartModule } from '@/modules/cart/cart.module';
import { ReviewRepositoryModule } from '@/_repositories/review/review.repository/review.repository.module';
import { UserAddressRepositoryModule } from '@/_repositories/user/user-address.repository/user-address.repository.module';
import { OrderCartIntegration } from './order-cart.integration';
import { OrderReviewIntegration } from './order-review.integration';
import { OrderUserAddressIntegration } from './order-user-address.integration';

@Module({
  imports: [CartModule, UserAddressRepositoryModule, ReviewRepositoryModule],
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
