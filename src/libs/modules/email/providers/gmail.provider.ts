import { Injectable, Logger } from '@nestjs/common';
import { IEmailProvider } from '../interfaces/email-provider.interface';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { AppEnvService } from '@/_config/app-env/app-env.service';

interface SentMessageInfo {
  messageId: string;
}

@Injectable()
export class GmailProvider implements IEmailProvider {
  private transporter: Transporter;
  private readonly logger = new Logger(GmailProvider.name);
  private readonly fromName: string;
  private readonly fromEmail: string;

  constructor(private readonly appEnv: AppEnvService) {
    const host = this.appEnv.MAIL_HOST;
    const port = this.appEnv.MAIL_PORT;
    const secure = this.appEnv.MAIL_SECURE === 'true';
    const user = this.appEnv.MAIL_USER;
    const password = this.appEnv.MAIL_PASSWORD;

    this.fromName = this.appEnv.MAIL_FROM_NAME;
    this.fromEmail = this.appEnv.MAIL_FROM_EMAIL;

    if (!user || !password) {
      this.logger.warn(
        'Email credentials not configured. Emails will not be sent.',
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass: password,
      },
    });
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<void> {
    try {
      console.log(
        '[DEBUG] GmailProvider attempting to send email to:',
        options.to,
      );
      const sendMailResult: unknown = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      const info = sendMailResult as SentMessageInfo;

      this.logger.log(`Email sent to ${options.to}: ${info.messageId}`);
      console.log('[DEBUG] GmailProvider success. MessageID:', info.messageId);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      console.error('[DEBUG] GmailProvider failed:', error);
      throw error;
    }
  }
}
