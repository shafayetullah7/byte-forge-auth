import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { EventsModule } from '@/common/modules/events/events.module';
import { CartFacade } from './application/cart.facade';
import {
  AddToCartCommand,
  AddWishlistItemCommand,
  BulkRemoveCartCommand,
  BulkUpdateCartCommand,
  CartCommandService,
  ClearCartCommand,
  MergeCartCommand,
  MergeGuestCartCommand,
  RemoveCartItemCommand,
  RemoveWishlistItemCommand,
  ResolveCartContextCommand,
  UpdateCartItemCommand,
} from './application/commands';
import { CartMergeListener } from './application/listeners/cart-merge.listener';
import {
  CartQueryService,
  GetCartCountQuery,
  GetCartQuery,
  ListWishlistQuery,
  ValidateCartQuery,
} from './application/queries';
import { CartController, WishlistController } from './controllers';
import { CartRepository } from './repositories/cart.repository';
import { WishlistRepository } from './repositories/wishlist.repository';

@Module({
  imports: [DrizzleModule, EventsModule],
  controllers: [CartController, WishlistController],
  providers: [
    CartRepository,
    WishlistRepository,
    CartQueryService,
    CartCommandService,
    GetCartQuery,
    GetCartCountQuery,
    ValidateCartQuery,
    ListWishlistQuery,
    AddToCartCommand,
    UpdateCartItemCommand,
    RemoveCartItemCommand,
    ClearCartCommand,
    BulkUpdateCartCommand,
    BulkRemoveCartCommand,
    MergeCartCommand,
    MergeGuestCartCommand,
    ResolveCartContextCommand,
    AddWishlistItemCommand,
    RemoveWishlistItemCommand,
    CartFacade,
    CartMergeListener,
  ],
  exports: [
    CartQueryService,
    CartCommandService,
    GetCartQuery,
    GetCartCountQuery,
    ValidateCartQuery,
    ListWishlistQuery,
    AddToCartCommand,
    UpdateCartItemCommand,
    RemoveCartItemCommand,
    ClearCartCommand,
    BulkUpdateCartCommand,
    BulkRemoveCartCommand,
    MergeCartCommand,
    MergeGuestCartCommand,
    ResolveCartContextCommand,
    AddWishlistItemCommand,
    RemoveWishlistItemCommand,
    CartFacade,
  ],
})
export class CartModule {}
