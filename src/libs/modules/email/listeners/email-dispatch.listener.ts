import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  AccountVerificationEmailSendEvent,
  EmailEventNames,
  PasswordResetEmailSendEvent,
} from '@/libs/modules/events/events';
import { EmailService } from '../email.service';

@Injectable()
export class EmailDispatchListener {
  private readonly logger = new Logger(EmailDispatchListener.name);

  constructor(private readonly emailService: EmailService) {}

  @OnEvent(EmailEventNames.ACCOUNT_VERIFICATION_SEND)
  async handleAccountVerificationEmail(
    event: AccountVerificationEmailSendEvent,
  ): Promise<void> {
    const { to, otp } = event.payload;

    try {
      await this.emailService.sendVerificationEmail(to, otp);
    } catch (error) {
      this.logger.error(
        `Failed to send account verification email to ${to}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  @OnEvent(EmailEventNames.PASSWORD_RESET_SEND)
  async handlePasswordResetEmail(
    event: PasswordResetEmailSendEvent,
  ): Promise<void> {
    const { to, otp } = event.payload;

    try {
      await this.emailService.sendPasswordResetEmail(to, otp);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${to}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
