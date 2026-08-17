import { HttpStatus } from '@nestjs/common';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { AdminRegistrationRateLimitRepository } from '../../../repositories/admin-registration-rate-limit.repository';
import {
  ADMIN_REGISTRATION_OTP_COOLDOWN_MS,
  AdminRegistrationRateLimiterService,
} from '../../admin-registration-rate-limiter.service';

describe('AdminRegistrationRateLimiterService', () => {
  const rateLimitRepository = {
    getLastOtpSentAtForUpdate: jest.fn(),
    recordOtpSent: jest.fn(),
  };

  const i18n = {
    t: jest.fn((key: string) => key),
  };

  const tx = {} as never;

  let limiter: AdminRegistrationRateLimiterService;

  beforeEach(() => {
    jest.clearAllMocks();
    limiter = new AdminRegistrationRateLimiterService(
      rateLimitRepository as unknown as AdminRegistrationRateLimitRepository,
      i18n as never,
    );
  });

  it('allows OTP when no prior send exists', async () => {
    rateLimitRepository.getLastOtpSentAtForUpdate.mockResolvedValue(null);

    await expect(limiter.assertCanSendOtp(tx, 'en')).resolves.toBeUndefined();
  });

  it('allows OTP when cooldown has elapsed', async () => {
    const lastSentAt = new Date(
      Date.now() - ADMIN_REGISTRATION_OTP_COOLDOWN_MS - 1_000,
    );
    rateLimitRepository.getLastOtpSentAtForUpdate.mockResolvedValue(lastSentAt);

    await expect(limiter.assertCanSendOtp(tx, 'en')).resolves.toBeUndefined();
  });

  it('throws when global cooldown is active', async () => {
    rateLimitRepository.getLastOtpSentAtForUpdate.mockResolvedValue(
      new Date(),
    );

    await expect(limiter.assertCanSendOtp(tx, 'en')).rejects.toThrow(
      CustomException,
    );

    try {
      await limiter.assertCanSendOtp(tx, 'en');
    } catch (error) {
      expect(error).toBeInstanceOf(CustomException);
      expect((error as CustomException).statusCode).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  });

  it('records OTP send timestamp', async () => {
    await limiter.recordOtpSent(tx);

    expect(rateLimitRepository.recordOtpSent).toHaveBeenCalledWith(
      tx,
      expect.any(Date),
    );
  });
});
