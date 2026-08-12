import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { AdminSessionModule } from './admin-session/admin-session.module';
import { AdminLanguagesModule } from './admin-i18n/languages/admin-languages.module';
import { AdminMediaModule } from './media/admin-media.module';
import { AdminUsersModule } from './users/admin-users.module';
import { AdminCampaignsModule } from './campaigns/admin-campaigns.module';

@Module({
  imports: [
    AdminModule,
    AdminAuthModule,
    AdminSessionModule,
    AdminLanguagesModule,
    AdminMediaModule,
    AdminUsersModule,
    AdminCampaignsModule,
  ],
  exports: [
    AdminModule,
    AdminAuthModule,
    AdminSessionModule,
    AdminLanguagesModule,
    AdminMediaModule,
    AdminUsersModule,
    AdminCampaignsModule,
  ],
})
export class AdminApiModule {}
