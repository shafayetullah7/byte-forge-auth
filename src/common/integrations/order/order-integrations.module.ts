import { forwardRef, Module } from '@nestjs/common';
import { CartModule } from '@/modules/cart/cart.module';
import { ReviewModule } from '@/modules/review/review.module';
import { UserModule } from '@/modules/user/user.module';
import { OrderCartIntegration } from './order-cart.integration';
import { OrderReviewIntegration } from './order-review.integration';
import { OrderUserAddressIntegration } from './order-user-address.integration';

@Module({
  imports: [
    forwardRef(() => CartModule),
    forwardRef(() => UserModule),
    ReviewModule,
  ],
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
