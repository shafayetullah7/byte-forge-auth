import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { AdminAuthGuardModule } from '@/common/guards/admin-auth-guard/admin-auth-guard.module';
import { SellerShopGuardModule } from '@/common/guards/seller-shop-guard/seller-shop.guard.module';
import { VerifiedUserAuthGuardModule } from '@/common/guards/verified-user-auth-guard/verified-user-auth.guard.module';
import { ShopModule } from '@/modules/shop/shop.module';
import {
  ApproveArticleCommand,
  ApproveCampaignCommand,
  ArchiveArticleCommand,
  ArchiveCampaignCommand,
  CreateArticleCommand,
  CreateCampaignCommand,
  DeleteArticleCommand,
  DeleteCampaignCommand,
  RejectArticleCommand,
  RejectCampaignCommand,
  SetArticleEditorsPickCommand,
  SubmitArticleCommand,
  SubmitCampaignCommand,
  UpdateArticleCommand,
  UpdateCampaignCommand,
} from './application/commands';
import {
  ContentQueryService,
  GetAdminArticleQuery,
  GetAdminCampaignQuery,
  GetPublicShopArticleQuery,
  GetPublicShopCampaignHighlightsQuery,
  GetPublicShopCampaignQuery,
  GetSellerArticleQuery,
  GetSellerCampaignQuery,
  ListAdminArticlesQuery,
  ListAdminCampaignsQuery,
  ListPublicShopArticlesQuery,
  ListPublicShopCampaignsQuery,
  ListSellerArticlesQuery,
  ListSellerCampaignsQuery,
} from './application/queries';
import {
  AdminArticlesController,
  AdminCampaignsController,
  PublicShopArticlesController,
  PublicShopCampaignsController,
  SellerArticlesController,
  SellerCampaignsController,
} from './controllers';
import { ArticleRepository, CampaignRepository } from './repositories';

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
    SellerCampaignsController,
    AdminCampaignsController,
    PublicShopCampaignsController,
  ],
  providers: [
    ArticleRepository,
    CampaignRepository,
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
    ListSellerCampaignsQuery,
    GetSellerCampaignQuery,
    CreateCampaignCommand,
    UpdateCampaignCommand,
    SubmitCampaignCommand,
    ArchiveCampaignCommand,
    DeleteCampaignCommand,
    ListAdminCampaignsQuery,
    GetAdminCampaignQuery,
    ApproveCampaignCommand,
    RejectCampaignCommand,
    ListPublicShopCampaignsQuery,
    GetPublicShopCampaignHighlightsQuery,
    GetPublicShopCampaignQuery,
  ],
  exports: [ContentQueryService],
})
export class ContentModule {}
