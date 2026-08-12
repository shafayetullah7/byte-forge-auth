import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { AdminLanguagesModule } from './admin-i18n/languages/admin-languages.module';
import { AdminUsersModule } from './users/admin-users.module';

@Module({
  imports: [AdminModule, AdminLanguagesModule, AdminUsersModule],
  exports: [AdminModule, AdminLanguagesModule, AdminUsersModule],
})
export class AdminApiModule {}
