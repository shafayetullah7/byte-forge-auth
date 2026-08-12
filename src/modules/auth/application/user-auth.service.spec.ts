import { UserAuthService } from './user-auth.service';
import { OtpPurpose } from '@/_db/drizzle/enum/otp.purpose.enum';
import { EmailEventNames } from '@/common/modules/events/events';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { UserLocalAuthService } from './user-local-auth.service';
import { CreateUserCommand } from '@/modules/user/application/commands/create-user.command';
import { UserQueryService } from '@/modules/user/application/queries/user.query';
import { UserSessionRepository } from '../repositories/user-session.repository';
import { SessionRepository } from '../repositories/session.repository';
import { OtpService } from '@/common/modules/otp/otp.service';
import { UserLocalAuthRepository } from '../repositories/user-local-auth.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HashingService } from '@/common/modules/hashing/hashing.service';
import { I18nService } from 'nestjs-i18n';

describe('UserAuthService.sendAccountVerificationOtp', () => {
  const drizzle = {
    client: {
      select: jest.fn(),
    },
  };

  const otpService = {
    getActiveOtpExpiry: jest.fn(),
    createOtp: jest.fn(),
  };

  const eventEmitter = {
    emit: jest.fn(),
  };

  const userLocalAuthService = {
    getLocalUser: jest.fn(),
  };

  const i18n = {
    t: jest.fn((key: string) => key),
  };

  let service: UserAuthService;

  const mockUserSelect = (rows: unknown[]) => {
    const limit = jest.fn().mockResolvedValue(rows);
    const where = jest.fn().mockReturnValue({ limit });
    const from = jest.fn().mockReturnValue({ where });
    drizzle.client.select.mockReturnValue({ from });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserAuthService(
      drizzle as unknown as DrizzleService,
      userLocalAuthService as unknown as UserLocalAuthService,
      {} as unknown as CreateUserCommand,
      {} as unknown as UserQueryService,
      {} as unknown as UserSessionRepository,
      {} as unknown as SessionRepository,
      otpService as unknown as OtpService,
      {} as unknown as UserLocalAuthRepository,
      eventEmitter as unknown as EventEmitter2,
      {} as unknown as HashingService,
      i18n as unknown as I18nService,
    );
  });

  it('reuses active OTP without emitting email when force is false', async () => {
    const existingExpiry = new Date(Date.now() + 2 * 60 * 1000);
    mockUserSelect([{ id: 'user-1', emailVerifiedAt: null }]);
    otpService.getActiveOtpExpiry.mockResolvedValue(existingExpiry);

    const result = await service.sendAccountVerificationOtp('user-1', 'en', {
      force: false,
    });

    expect(otpService.getActiveOtpExpiry).toHaveBeenCalledWith(
      'user-1',
      OtpPurpose.ACCOUNT_VERIFICATION,
    );
    expect(otpService.createOtp).not.toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
    expect(result).toEqual({ expiresAt: existingExpiry, sent: false });
  });

  it('creates OTP and emits email event when force is true', async () => {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    mockUserSelect([{ id: 'user-1', emailVerifiedAt: null }]);
    userLocalAuthService.getLocalUser.mockResolvedValue({
      userLocalAuth: { email: 'user@example.com' },
    });
    otpService.createOtp.mockResolvedValue({ otp: '123456', expiresAt });

    const result = await service.sendAccountVerificationOtp('user-1', 'en', {
      force: true,
    });

    expect(otpService.getActiveOtpExpiry).not.toHaveBeenCalled();
    expect(otpService.createOtp).toHaveBeenCalledWith(
      'user-1',
      OtpPurpose.ACCOUNT_VERIFICATION,
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      EmailEventNames.ACCOUNT_VERIFICATION_SEND,
      expect.objectContaining({
        payload: {
          to: 'user@example.com',
          otp: '123456',
          lang: 'en',
        },
      }),
    );
    expect(result).toEqual({ expiresAt, sent: true });
  });

  it('creates OTP and emits email event when no active OTP exists', async () => {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    mockUserSelect([{ id: 'user-1', emailVerifiedAt: null }]);
    otpService.getActiveOtpExpiry.mockResolvedValue(null);
    userLocalAuthService.getLocalUser.mockResolvedValue({
      userLocalAuth: { email: 'user@example.com' },
    });
    otpService.createOtp.mockResolvedValue({ otp: '654321', expiresAt });

    const result = await service.sendAccountVerificationOtp('user-1', 'en');

    expect(otpService.createOtp).toHaveBeenCalled();
    expect(eventEmitter.emit).toHaveBeenCalled();
    expect(result).toEqual({ expiresAt, sent: true });
  });
});
