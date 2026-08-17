import { OtpService } from './otp.service';
import { OTP_EXPIRY_MINUTES } from './otp.constants';

describe('OTP_EXPIRY_MINUTES', () => {
  it('is 5 minutes', () => {
    expect(OTP_EXPIRY_MINUTES).toBe(5);
  });
});

describe('OtpService', () => {
  const service = new OtpService();

  it('generateOtp returns a 6-digit numeric string', () => {
    const otp = service.generateOtp();

    expect(otp).toMatch(/^\d{6}$/);
  });
});
