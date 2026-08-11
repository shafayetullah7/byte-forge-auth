import { Module } from '@nestjs/common';
import { PublicShopController } from './controllers/public-shop.controller';
import { PublicShopService } from './services/public-shop.service';
import { ListPublicShopsService } from './services/list-public-shops.service';
import { ListPublicShopProductsService } from './services/list-public-shop-products.service';
import { PublicShopReviewsService } from './services/public-shop-reviews.service';
import { GetShopCategoriesServedService } from './services/get-shop-categories-served.service';
import { ListPublicShopCampaignsService } from './services/list-public-shop-campaigns.service';
import { ListPublicShopArticlesService } from './services/list-public-shop-articles.service';
import { ShopModule } from '@/modules/shop/shop.module';
import { ShopCampaignRepositoryModule } from '@/_repositories/business/shop-campaign.repository/shop-campaign.repository.module';
import { ShopArticleRepositoryModule } from '@/_repositories/business/shop-article.repository/shop-article.repository.module';
import { ShopFollowRepositoryModule } from '@/_repositories/business/shop-follow.repository/shop-follow.repository.module';
import { ReviewRepository } from '@/_repositories/review/review.repository/review.repository';

@Module({
  imports: [
    ShopModule,
    ShopCampaignRepositoryModule,
    ShopArticleRepositoryModule,
    ShopFollowRepositoryModule,
  ],
  controllers: [PublicShopController],
  providers: [
    PublicShopService,
    ListPublicShopsService,
    ListPublicShopProductsService,
    PublicShopReviewsService,
    ListPublicShopCampaignsService,
    ListPublicShopArticlesService,
    GetShopCategoriesServedService,
    ReviewRepository,
  ],
})
export class PublicShopsModule {}
