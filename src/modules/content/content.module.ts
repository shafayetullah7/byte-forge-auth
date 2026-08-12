import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { AdminAuthGuardModule } from '@/common/guards/admin-auth-guard/admin-auth-guard.module';
import { SellerShopGuardModule } from '@/common/guards/seller-shop-guard/seller-shop.guard.module';
import { VerifiedUserAuthGuardModule } from '@/common/guards/verified-user-auth-guard/verified-user-auth.guard.module';
import { ShopModule } from '@/modules/shop/shop.module';
import {
  ApproveArticleCommand,
  ArchiveArticleCommand,
  CreateArticleCommand,
  DeleteArticleCommand,
  RejectArticleCommand,
  SetArticleEditorsPickCommand,
  SubmitArticleCommand,
  UpdateArticleCommand,
} from './application/commands';
import {
  ContentQueryService,
  GetAdminArticleQuery,
  GetPublicShopArticleQuery,
  GetSellerArticleQuery,
  ListAdminArticlesQuery,
  ListPublicShopArticlesQuery,
  ListSellerArticlesQuery,
} from './application/queries';
import {
  AdminArticlesController,
  PublicShopArticlesController,
  SellerArticlesController,
} from './controllers';
import { ArticleRepository } from './repositories/article.repository';

@Module({
  imports: [
    DrizzleModule,
    ShopModule,
    AdminAuthGuardModule,
    VerifiedUserAuthGuardModule,
    SellerShopGuardModule,
  ],
  controllers: [
    SellerArticlesController,
    AdminArticlesController,
    PublicShopArticlesController,
  ],
  providers: [
    ArticleRepository,
    ContentQueryService,
    ListSellerArticlesQuery,
    GetSellerArticleQuery,
    CreateArticleCommand,
    UpdateArticleCommand,
    SubmitArticleCommand,
    ArchiveArticleCommand,
    DeleteArticleCommand,
    ListAdminArticlesQuery,
    GetAdminArticleQuery,
    ApproveArticleCommand,
    RejectArticleCommand,
    SetArticleEditorsPickCommand,
    ListPublicShopArticlesQuery,
    GetPublicShopArticleQuery,
  ],
  exports: [ContentQueryService],
})
export class ContentModule {}
