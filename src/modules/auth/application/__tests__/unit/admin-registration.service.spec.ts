import { HttpStatus } from '@nestjs/common';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';
import {
  AdminRegistrationOtpEmailSendEvent,
  EmailEventNames,
} from '@/libs/modules/events/events';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';
import { HashingService } from '@/libs/modules/hashing/hashing.service';
import { OtpService } from '@/libs/modules/otp/otp.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { I18nService } from 'nestjs-i18n';
import { AdminLocalAuthRepository } from '../../../repositories/admin-local-auth.repository';
import { AdminRegistrationPendingRepository } from '../../../repositories/admin-registration-pending.repository';
import { AdminRegistrationRateLimiterService } from '../../admin-registration-rate-limiter.service';
import { AdminRegistrationService } from '../../admin-registration.service';
import { AdminService } from '../../admin.service';

describe('AdminRegistrationService', () => {
  const drizzle = {
    client: {
      select: jest.fn(),
    },
    transaction: jest.fn(),
  };

  const adminService = {
    createAdmin: jest.fn(),
  };

  const adminLocalAuthRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const pendingRepository = {
    findByEmail: jest.fn(),
    findByUserNameExcludingEmail: jest.fn(),
    upsertPendingRegistration: jest.fn(),
    deleteByEmail: jest.fn(),
  };

  const rateLimiter = {
    assertCanSendOtp: jest.fn(),
    recordOtpSent: jest.fn(),
  };

  const hashingService = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  const otpService = {
    generateOtp: jest.fn(),
  };

  const configService = {
    adminRegistrationOtpEmail: 'gatekeeper@example.com',
  };

  const eventEmitter = {
    emit: jest.fn(),
  };

  const i18n = {
    t: jest.fn((key: string) => key),
  };

  let service: AdminRegistrationService;

  const payload = {
    email: 'admin@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    userName: 'jane_admin',
    password: 'Secret123!',
  };

  const mockAdminUserNameSelect = (rows: unknown[]) => {
    const limit = jest.fn().mockResolvedValue(rows);
    const where = jest.fn().mockReturnValue({ limit });
    const from = jest.fn().mockReturnValue({ where });
    drizzle.client.select.mockReturnValue({ from });
  };

  beforeEach(() => {
    jest.clearAllMocks();

    drizzle.transaction.mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) => callback({}),
    );

    rateLimiter.assertCanSendOtp.mockResolvedValue(undefined);
    rateLimiter.recordOtpSent.mockResolvedValue(undefined);

    service = new AdminRegistrationService(
      drizzle as unknown as DrizzleService,
      adminService as unknown as AdminService,
      adminLocalAuthRepository as unknown as AdminLocalAuthRepository,
      pendingRepository as unknown as AdminRegistrationPendingRepository,
      rateLimiter as unknown as AdminRegistrationRateLimiterService,
      hashingService as unknown as HashingService,
      otpService as unknown as OtpService,
      configService as unknown as AppConfigService,
      eventEmitter as unknown as EventEmitter2,
      i18n as unknown as I18nService,
    );
  });

  it('requests OTP, stores pending registration, and emails gatekeeper', async () => {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    adminLocalAuthRepository.findOne.mockResolvedValue(null);
    mockAdminUserNameSelect([]);
    pendingRepository.findByUserNameExcludingEmail.mockResolvedValue(null);
    hashingService.hash
      .mockResolvedValueOnce('hashed-password')
      .mockResolvedValueOnce('hashed-otp');
    otpService.generateOtp.mockReturnValue('123456');
    pendingRepository.upsertPendingRegistration.mockResolvedValue({
      email: payload.email,
      expiresAt,
    });

    const result = await service.requestRegistrationOtp(payload, 'en');

    expect(rateLimiter.assertCanSendOtp).toHaveBeenCalled();
    expect(pendingRepository.upsertPendingRegistration).toHaveBeenCalledWith(
      expect.objectContaining({
        email: payload.email,
        userName: payload.userName,
        hashedPassword: 'hashed-password',
        hashedOtp: 'hashed-otp',
      }),
      expect.anything(),
    );
    expect(rateLimiter.recordOtpSent).toHaveBeenCalled();
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      EmailEventNames.ADMIN_REGISTRATION_OTP_SEND,
      expect.any(AdminRegistrationOtpEmailSendEvent),
    );
    expect(result.expiresAt).toBeInstanceOf(Date);
  });

  it('rejects OTP request when email already exists', async () => {
    adminLocalAuthRepository.findOne.mockResolvedValue({ email: payload.email });

    await expect(service.requestRegistrationOtp(payload, 'en')).rejects.toMatchObject({
      statusCode: HttpStatus.CONFLICT,
      errorCode: ErrorCode.DUPLICATE_ENTRY,
    });

    expect(rateLimiter.assertCanSendOtp).not.toHaveBeenCalled();
  });

  it('rejects OTP request when username already exists on an admin', async () => {
    adminLocalAuthRepository.findOne.mockResolvedValue(null);
    mockAdminUserNameSelect([{ id: 'existing-admin' }]);

    await expect(service.requestRegistrationOtp(payload, 'en')).rejects.toMatchObject({
      statusCode: HttpStatus.CONFLICT,
      errorCode: ErrorCode.DUPLICATE_ENTRY,
    });
  });

  it('rejects OTP request when username is reserved by another pending registration', async () => {
    adminLocalAuthRepository.findOne.mockResolvedValue(null);
    mockAdminUserNameSelect([]);
    pendingRepository.findByUserNameExcludingEmail.mockResolvedValue({
      email: 'other@example.com',
      userName: payload.userName,
    });

    await expect(service.requestRegistrationOtp(payload, 'en')).rejects.toMatchObject({
      statusCode: HttpStatus.CONFLICT,
      errorCode: ErrorCode.DUPLICATE_ENTRY,
    });
  });

  it('rejects OTP request when global rate limit is active', async () => {
    adminLocalAuthRepository.findOne.mockResolvedValue(null);
    mockAdminUserNameSelect([]);
    pendingRepository.findByUserNameExcludingEmail.mockResolvedValue(null);
    rateLimiter.assertCanSendOtp.mockRejectedValueOnce(
      new CustomException({
        message: 'message.error.adminRegistrationRateLimited',
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        errorCode: ErrorCode.TOO_MANY_REQUESTS,
      }),
    );

    await expect(service.requestRegistrationOtp(payload, 'en')).rejects.toMatchObject({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      errorCode: ErrorCode.TOO_MANY_REQUESTS,
    });

    expect(pendingRepository.upsertPendingRegistration).not.toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('replaces pending registration when the same email requests OTP again', async () => {
    adminLocalAuthRepository.findOne.mockResolvedValue(null);
    mockAdminUserNameSelect([]);
    pendingRepository.findByUserNameExcludingEmail.mockResolvedValue(null);
    hashingService.hash
      .mockResolvedValueOnce('hashed-password-1')
      .mockResolvedValueOnce('hashed-otp-1')
      .mockResolvedValueOnce('hashed-password-2')
      .mockResolvedValueOnce('hashed-otp-2');
    otpService.generateOtp.mockReturnValueOnce('111111').mockReturnValueOnce('222222');

    await service.requestRegistrationOtp(payload, 'en');
    await service.requestRegistrationOtp(payload, 'en');

    expect(pendingRepository.upsertPendingRegistration).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ hashedOtp: 'hashed-otp-1' }),
      expect.anything(),
    );
    expect(pendingRepository.upsertPendingRegistration).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ hashedOtp: 'hashed-otp-2' }),
      expect.anything(),
    );
    expect(eventEmitter.emit).toHaveBeenCalledTimes(2);
  });

  it('completes registration when OTP and payload match pending row', async () => {
    const pending = {
      email: payload.email,
      userName: payload.userName,
      firstName: payload.firstName,
      lastName: payload.lastName,
      hashedPassword: 'hashed-password',
      hashedOtp: 'hashed-otp',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    };

    pendingRepository.findByEmail.mockResolvedValue(pending);
    hashingService.compare
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);
    adminService.createAdmin.mockResolvedValue({ id: 'admin-1' });
    pendingRepository.deleteByEmail.mockResolvedValue(undefined);

    const result = await service.completeRegistration(
      { ...payload, otp: '123456' },
      'en',
    );

    expect(adminService.createAdmin).toHaveBeenCalled();
    expect(adminLocalAuthRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: 'admin-1',
        email: payload.email,
        password: 'hashed-password',
        verfied: true,
      }),
      expect.anything(),
    );
    expect(pendingRepository.deleteByEmail).toHaveBeenCalledWith(
      payload.email,
      expect.anything(),
    );
    expect(result).toEqual({ id: 'admin-1' });
  });

  it('rejects completion when OTP is invalid', async () => {
    const pending = {
      email: payload.email,
      userName: payload.userName,
      firstName: payload.firstName,
      lastName: payload.lastName,
      hashedPassword: 'hashed-password',
      hashedOtp: 'hashed-otp',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    };

    pendingRepository.findByEmail.mockResolvedValue(pending);
    hashingService.compare.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    await expect(
      service.completeRegistration({ ...payload, otp: '000000' }, 'en'),
    ).rejects.toMatchObject({
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: ErrorCode.INVALID_OTP,
    });

    expect(adminService.createAdmin).not.toHaveBeenCalled();
    expect(pendingRepository.deleteByEmail).not.toHaveBeenCalled();
  });

  it('rejects completion when OTP is expired', async () => {
    const pending = {
      email: payload.email,
      userName: payload.userName,
      firstName: payload.firstName,
      lastName: payload.lastName,
      hashedPassword: 'hashed-password',
      hashedOtp: 'hashed-otp',
      expiresAt: new Date(Date.now() - 1_000),
    };

    pendingRepository.findByEmail.mockResolvedValue(pending);
    hashingService.compare.mockResolvedValueOnce(true);

    await expect(
      service.completeRegistration({ ...payload, otp: '123456' }, 'en'),
    ).rejects.toMatchObject({
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: ErrorCode.INVALID_OTP,
    });

    expect(adminService.createAdmin).not.toHaveBeenCalled();
  });

  it('rejects completion when pending registration is missing', async () => {
    pendingRepository.findByEmail.mockResolvedValue(null);

    await expect(
      service.completeRegistration({ ...payload, otp: '123456' }, 'en'),
    ).rejects.toMatchObject({
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: ErrorCode.INVALID_OTP,
    });
  });

  it('rejects completion when payload fields differ from pending registration', async () => {
    const pending = {
      email: payload.email,
      userName: payload.userName,
      firstName: payload.firstName,
      lastName: payload.lastName,
      hashedPassword: 'hashed-password',
      hashedOtp: 'hashed-otp',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    };

    pendingRepository.findByEmail.mockResolvedValue(pending);

    await expect(
      service.completeRegistration(
        { ...payload, userName: 'other_admin', otp: '123456' },
        'en',
      ),
    ).rejects.toMatchObject({
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: ErrorCode.INVALID_OTP,
    });
  });
});
