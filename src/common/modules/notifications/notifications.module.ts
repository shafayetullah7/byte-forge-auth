import { Module } from '@nestjs/common';
import { EmailModule } from '@/common/modules/email/email.module';
import { AppEnvModule } from '@/_config/app-env/app-env.module';
import { UserLocalAuthRepositoryModule } from '@/_repositories/user/user.local.auth.repository/user.local.auth.repository.module';
import { ShopModule } from '@/modules/shop/shop.module';
import { TransactionalEmailListener } from './listeners/transactional-email.listener';
import { NotificationRecipientService } from './services/notification-recipient.service';
import { TransactionalEmailService } from './services/transactional-email.service';

@Module({
  imports: [
    EmailModule,
    AppEnvModule,
    UserLocalAuthRepositoryModule,
    ShopModule,
  ],
  providers: [
    TransactionalEmailListener,
    NotificationRecipientService,
    TransactionalEmailService,
  ],
})
export class NotificationsModule {}
