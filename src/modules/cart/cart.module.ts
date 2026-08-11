import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import {
  AddToCartCommand,
  BulkRemoveCartCommand,
  BulkUpdateCartCommand,
  CartCommandService,
  ClearCartCommand,
  MergeCartCommand,
  MergeGuestCartCommand,
  RemoveCartItemCommand,
  ResolveCartContextCommand,
  UpdateCartItemCommand,
} from './application/commands';
import {
  CartQueryService,
  GetCartCountQuery,
  GetCartQuery,
  ValidateCartQuery,
} from './application/queries';
import { CartRepository } from './repositories/cart.repository';

/**
 * Cart domain module. Buyer HTTP endpoints remain under `src/api/user/buyer/cart/`
 * until Phase 15 controller cutover.
 */
@Module({
  imports: [DrizzleModule],
  controllers: [],
  providers: [
    CartRepository,
    CartQueryService,
    CartCommandService,
    GetCartQuery,
    GetCartCountQuery,
    ValidateCartQuery,
    AddToCartCommand,
    UpdateCartItemCommand,
    RemoveCartItemCommand,
    ClearCartCommand,
    BulkUpdateCartCommand,
    BulkRemoveCartCommand,
    MergeCartCommand,
    MergeGuestCartCommand,
    ResolveCartContextCommand,
  ],
  exports: [
    CartQueryService,
    CartCommandService,
    GetCartQuery,
    GetCartCountQuery,
    ValidateCartQuery,
    AddToCartCommand,
    UpdateCartItemCommand,
    RemoveCartItemCommand,
    ClearCartCommand,
    BulkUpdateCartCommand,
    BulkRemoveCartCommand,
    MergeCartCommand,
    MergeGuestCartCommand,
    ResolveCartContextCommand,
    CartRepository,
  ],
})
export class CartModule {}
