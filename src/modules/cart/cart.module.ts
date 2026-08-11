import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { CartCommandService } from './application/commands';
import { CartQueryService } from './application/queries';
import { CartRepository } from './repositories/cart.repository';

/**
 * Cart domain module. Buyer HTTP endpoints remain under `src/api/user/buyer/cart/`
 * until Phase 15 controller cutover.
 */
@Module({
  imports: [DrizzleModule],
  controllers: [],
  providers: [CartRepository, CartQueryService, CartCommandService],
  exports: [CartQueryService, CartCommandService, CartRepository],
})
export class CartModule {}
