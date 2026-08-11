import { Module } from '@nestjs/common';
import { ShopFollowController } from './shop-follow.controller';
import { ShopFollowService } from './shop-follow.service';
import { ShopFollowRepositoryModule } from '@/_repositories/business/shop-follow.repository/shop-follow.repository.module';
import { ShopModule } from '@/modules/shop/shop.module';
import { VerifiedUserAuthGuardModule } from '@/common/guards/verified-user-auth-guard/verified-user-auth.guard.module';

@Module({
  imports: [
    ShopFollowRepositoryModule,
    ShopModule,
    VerifiedUserAuthGuardModule,
  ],
  controllers: [ShopFollowController],
  providers: [ShopFollowService],
})
export class ShopFollowModule {}
