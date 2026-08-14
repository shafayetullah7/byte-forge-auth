import { Injectable } from '@nestjs/common';
import { AppEnvService } from '@/_config/app-env/app-env.service';
import { IEmailProvider } from './interfaces/email-provider.interface';
import { GmailProvider } from './providers/gmail.provider';
import { ConsoleProvider } from './providers/console.provider';
import { EmailTemplateService } from './services/email-template.service';
import { EmailTemplateId } from './templates/types/email-template-id.enum';
import type {
  EmailRenderArgs,
  RenderedEmail,
} from './templates/types/email-template.types';
import { OTP_EXPIRY_MINUTES } from '@/libs/modules/otp/otp.constants';

@Injectable()
export class EmailService {
  private provider: IEmailProvider;

  constructor(
    private readonly appEnv: AppEnvService,
    private readonly gmailProvider: GmailProvider,
    private readonly consoleProvider: ConsoleProvider,
    private readonly emailTemplateService: EmailTemplateService,
  ) {
    const providerType = this.appEnv.MAIL_PROVIDER;

    switch (providerType) {
      case 'gmail':
      case 'smtp':
        this.provider = this.gmailProvider;
        break;
      case 'console':
      default:
        this.provider = this.consoleProvider;
        break;
    }
  }

  async sendRenderedEmail(
    params: { to: string } & RenderedEmail,
  ): Promise<void> {
    const { to, subject, text, html } = params;
    await this.provider.sendEmail({ to, subject, text, html });
  }

  async sendVerificationEmail(to: string, otp: string): Promise<void> {
    const rendered = this.emailTemplateService.render(
      EmailTemplateId.AUTH_ACCOUNT_VERIFICATION,
      { otp, minutes: String(OTP_EXPIRY_MINUTES) },
    );
    await this.sendRenderedEmail({ to, ...rendered });
  }

  async sendPasswordResetEmail(to: string, otp: string): Promise<void> {
    const rendered = this.emailTemplateService.render(
      EmailTemplateId.AUTH_PASSWORD_RESET,
      { otp, minutes: String(OTP_EXPIRY_MINUTES) },
    );
    await this.sendRenderedEmail({ to, ...rendered });
  }

  async sendAdminRegistrationOtpEmail(
    to: string,
    args: {
      otp: string;
      registrantEmail: string;
      registrantUserName: string;
      registrantName: string;
    },
  ): Promise<void> {
    const rendered = this.emailTemplateService.render(
      EmailTemplateId.AUTH_ADMIN_REGISTRATION_OTP,
      {
        otp: args.otp,
        minutes: String(OTP_EXPIRY_MINUTES),
        registrantEmail: args.registrantEmail,
        registrantUserName: args.registrantUserName,
        registrantName: args.registrantName,
      },
    );
    await this.sendRenderedEmail({ to, ...rendered });
  }

  async sendTransactionalEmail(
    templateId: EmailTemplateId,
    to: string,
    args: EmailRenderArgs,
  ): Promise<void> {
    const rendered = this.emailTemplateService.render(templateId, args);
    await this.sendRenderedEmail({ to, ...rendered });
  }
}
