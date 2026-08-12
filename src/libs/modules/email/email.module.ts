import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { GmailProvider } from './providers/gmail.provider';
import { ConsoleProvider } from './providers/console.provider';
import { AppEnvModule } from '@/_config/app-env/app-env.module';
import { EmailDispatchListener } from './listeners/email-dispatch.listener';
import { EmailCopyService } from './services/email-copy.service';
import { EmailTemplateService } from './services/email-template.service';

@Module({
  imports: [AppEnvModule],
  controllers: [EmailController],
  providers: [
    EmailService,
    GmailProvider,
    ConsoleProvider,
    EmailDispatchListener,
    EmailCopyService,
    EmailTemplateService,
  ],
  exports: [EmailService, EmailTemplateService],
})
export class EmailModule {}
