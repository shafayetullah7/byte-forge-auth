import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { AdminSessionModule } from './admin-session/admin-session.module';
import { AdminLanguagesModule } from './admin-i18n/languages/admin-languages.module';
import { AdminMediaModule } from './media/admin-media.module';
import { AdminReviewsModule } from './reviews/admin-reviews.module';
import { AdminUsersModule } from './users/admin-users.module';
import { AdminCampaignsModule } from './campaigns/admin-campaigns.module';
import { AdminArticlesModule } from './articles/admin-articles.module';

@Module({
  imports: [
    AdminModule,
    AdminAuthModule,
    AdminSessionModule,
    AdminLanguagesModule,
    AdminMediaModule,
    AdminReviewsModule,
    AdminUsersModule,
    AdminCampaignsModule,
    AdminArticlesModule,
  ],
  exports: [
    AdminModule,
    AdminAuthModule,
    AdminSessionModule,
    AdminLanguagesModule,
    AdminMediaModule,
    AdminReviewsModule,
    AdminUsersModule,
    AdminCampaignsModule,
    AdminArticlesModule,
  ],
})
export class AdminApiModule {}
