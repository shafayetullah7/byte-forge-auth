import { Injectable, Logger } from '@nestjs/common';
import { IEmailProvider } from '../interfaces/email-provider.interface';
import { AppEnvService } from '@/_config/app-env/app-env.service';

@Injectable()
export class ConsoleProvider implements IEmailProvider {
  private readonly logger = new Logger(ConsoleProvider.name);

  constructor(private readonly appEnv: AppEnvService) {}

  // eslint-disable-next-line @typescript-eslint/require-await
  async sendEmail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<void> {
    const from = `"${this.appEnv.MAIL_FROM_NAME}" <${this.appEnv.MAIL_FROM_EMAIL}>`;
    this.logger.log('📧 ========== EMAIL (Console Mode) ==========');
    this.logger.log(`From: ${from}`);
    this.logger.log(`To: ${options.to}`);
    this.logger.log(`Subject: ${options.subject}`);
    this.logger.log('---');
    this.logger.log(options.text || options.html || '(no content)');
    this.logger.log('📧 ==========================================');
  }
}
