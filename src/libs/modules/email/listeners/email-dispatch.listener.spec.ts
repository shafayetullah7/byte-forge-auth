import { EmailDispatchListener } from './email-dispatch.listener';
import {
  AccountVerificationEmailSendEvent,
  AdminRegistrationOtpEmailSendEvent,
} from '@/libs/modules/events/events';
import { EmailService } from '../email.service';

describe('EmailDispatchListener', () => {
  const emailService = {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendAdminRegistrationOtpEmail: jest.fn(),
  };

  let listener: EmailDispatchListener;

  beforeEach(() => {
    jest.clearAllMocks();
    listener = new EmailDispatchListener(
      emailService as unknown as EmailService,
    );
  });

  it('sends account verification email via template service', async () => {
    await listener.handleAccountVerificationEmail(
      new AccountVerificationEmailSendEvent({
        to: 'user@example.com',
        otp: '123456',
        lang: 'en',
      }),
    );

    expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
      'user@example.com',
      '123456',
    );
  });

  it('sends admin registration OTP email with registrant details', async () => {
    await listener.handleAdminRegistrationOtpEmail(
      new AdminRegistrationOtpEmailSendEvent({
        to: 'gatekeeper@example.com',
        otp: '654321',
        lang: 'en',
        registrantEmail: 'newadmin@example.com',
        registrantUserName: 'new_admin',
        registrantName: 'Jane Doe',
      }),
    );

    expect(emailService.sendAdminRegistrationOtpEmail).toHaveBeenCalledWith(
      'gatekeeper@example.com',
      {
        otp: '654321',
        registrantEmail: 'newadmin@example.com',
        registrantUserName: 'new_admin',
        registrantName: 'Jane Doe',
      },
    );
  });
});
