import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  AdminRegistrationOtpEmailSendEvent,
  EmailEventNames,
} from '@/libs/modules/events/events';
import { EmailService } from '../email.service';

@Injectable()
export class EmailDispatchListener {
  private readonly logger = new Logger(EmailDispatchListener.name);

  constructor(private readonly emailService: EmailService) {}

  @OnEvent(EmailEventNames.ADMIN_REGISTRATION_OTP_SEND)
  async handleAdminRegistrationOtpEmail(
    event: AdminRegistrationOtpEmailSendEvent,
  ): Promise<void> {
    const {
      to,
      otp,
      registrantEmail,
      registrantUserName,
      registrantName,
    } = event.payload;

    try {
      await this.emailService.sendAdminRegistrationOtpEmail(to, {
        otp,
        registrantEmail,
        registrantUserName,
        registrantName,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send admin registration OTP email to ${to}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
