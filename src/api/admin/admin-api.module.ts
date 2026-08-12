import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { AdminLanguagesModule } from './admin-i18n/languages/admin-languages.module';

@Module({
  imports: [AdminModule, AdminLanguagesModule],
  exports: [AdminModule, AdminLanguagesModule],
})
export class AdminApiModule {}
