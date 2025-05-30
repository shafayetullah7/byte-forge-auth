import { Injectable } from '@nestjs/common';
import { SentMessageInfo, Transporter } from 'nodemailer';
import nodemailer from 'nodemailer';
import { EmailOptions, EmailResponse } from '../interfaces';
import { AppConfigService } from '../../app-config/app-config.service';

@Injectable()
export class GmailTransport {
  private transporter: Transporter<SentMessageInfo>;
  private gmailUser: string = '';
  private gmailAppPassword: string = '';

  constructor(private readonly configService: AppConfigService) {
    const gmailUser = configService.gmailUser;
    const gmailAppPassword = configService.gmailAppPassword;

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });
  }

  async sendMail(options: EmailOptions): Promise<EmailResponse> {
    try {
      const emailOptions: EmailOptions = {
        from: options.from || this.configService.defaultFromEmail,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments,
      };
      const info = (await this.transporter.sendMail(emailOptions)) as {
        messageId: string;
      };

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: unknown) {
      console.log('email error', error);
      return {
        success: false,
      };
    }
  }
}
