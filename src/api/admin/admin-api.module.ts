import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { AdminSessionModule } from './admin-session/admin-session.module';
import { AdminTagGroupsModule } from './admin-taxonomy/tag-groups/admin-tag-groups.module';
import { AdminTagsModule } from './admin-taxonomy/tags/admin-tags.module';
import { AdminCategoriesModule } from './admin-taxonomy/categories/admin-categories.module';
import { AdminLanguagesModule } from './admin-i18n/languages/admin-languages.module';
import { AdminShopModule } from './admin-shop/admin-shop.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { AdminMediaModule } from './media/admin-media.module';
import { AdminReviewsModule } from './reviews/admin-reviews.module';
import { AdminProductsModule } from './products/admin-products.module';
import { AdminUsersModule } from './users/admin-users.module';
import { AdminCampaignsModule } from './campaigns/admin-campaigns.module';
import { AdminArticlesModule } from './articles/admin-articles.module';

@Module({
  imports: [
    AdminModule,
    AdminAuthModule,
    AdminSessionModule,
    AdminTagGroupsModule,
    AdminTagsModule,
    AdminCategoriesModule,
    AdminLanguagesModule,
    AdminShopModule,
    PaymentMethodsModule,
    AdminMediaModule,
    AdminReviewsModule,
    AdminProductsModule,
    AdminUsersModule,
    AdminCampaignsModule,
    AdminArticlesModule,
  ],
  exports: [
    AdminModule,
    AdminAuthModule,
    AdminSessionModule,
    AdminTagGroupsModule,
    AdminTagsModule,
    AdminCategoriesModule,
    AdminLanguagesModule,
    AdminShopModule,
    PaymentMethodsModule,
    AdminMediaModule,
    AdminReviewsModule,
    AdminProductsModule,
    AdminUsersModule,
    AdminCampaignsModule,
    AdminArticlesModule,
  ],
})
export class AdminApiModule {}
