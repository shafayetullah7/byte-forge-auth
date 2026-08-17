import { EmailDispatchListener } from '../../email-dispatch.listener';
import { AdminRegistrationOtpEmailSendEvent } from '@/libs/modules/events/events';
import { EmailService } from '../../../email.service';

describe('EmailDispatchListener', () => {
  const emailService = {
    sendAdminRegistrationOtpEmail: jest.fn(),
  };

  let listener: EmailDispatchListener;

  beforeEach(() => {
    jest.clearAllMocks();
    listener = new EmailDispatchListener(
      emailService as unknown as EmailService,
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
