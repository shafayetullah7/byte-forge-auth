import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { GetCartService } from './services/get-cart.service';
import { AddToCartService } from './services/add-to-cart.service';
import { UpdateCartItemService } from './services/update-cart-item.service';
import { RemoveCartItemService } from './services/remove-cart-item.service';
import { ClearCartService } from './services/clear-cart.service';
import { ValidateCartService } from './services/validate-cart.service';
import { BulkUpdateCartService } from './services/bulk-update-cart.service';
import { BulkRemoveCartService } from './services/bulk-remove-cart.service';
import { MergeCartService } from './services/merge-cart.service';
import { CartMergeListener } from './listeners/cart-merge.listener';
import { CartModule as CartDomainModule } from '@/modules/cart/cart.module';
import { UserAuthGuardModule } from '@/common/guards/user-auth-guard/user-auth-guard.module';
import { CartAccessGuardModule } from '@/common/guards/cart-access-guard/cart-access-guard.module';
import { EventsModule } from '@/common/modules/events/events.module';

@Module({
  controllers: [CartController],
  providers: [
    CartService,
    GetCartService,
    AddToCartService,
    UpdateCartItemService,
    RemoveCartItemService,
    ClearCartService,
    ValidateCartService,
    BulkUpdateCartService,
    BulkRemoveCartService,
    MergeCartService,
    CartMergeListener,
  ],
  imports: [
    CartDomainModule,
    UserAuthGuardModule,
    CartAccessGuardModule,
    EventsModule,
  ],
  exports: [CartService],
})
export class CartModule {}
