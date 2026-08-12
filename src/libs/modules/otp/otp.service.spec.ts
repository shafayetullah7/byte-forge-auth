import { OtpService } from './otp.service';
import { OTP_EXPIRY_MINUTES } from './otp.constants';
import { OtpPurpose } from '@/_db/drizzle/enum/otp.purpose.enum';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { HashingService } from '@/libs/modules/hashing/hashing.service';
import { I18nService } from 'nestjs-i18n';

describe('OTP_EXPIRY_MINUTES', () => {
  it('is 5 minutes', () => {
    expect(OTP_EXPIRY_MINUTES).toBe(5);
  });
});

describe('OtpService', () => {
  let service: OtpService;
  let mockSelect: jest.Mock;
  let mockFrom: jest.Mock;
  let mockWhere: jest.Mock;
  let mockLimit: jest.Mock;

  const drizzle = {
    client: {
      select: jest.fn(),
    },
    transaction: jest.fn(),
  };

  const hashingService = {
    hash: jest.fn().mockResolvedValue('hashed'),
    compare: jest.fn(),
  };

  const i18n = {
    t: jest.fn((key: string) => key),
  };

  beforeEach(() => {
    mockLimit = jest.fn();
    mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
    mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
    mockSelect = jest.fn().mockReturnValue({ from: mockFrom });
    drizzle.client.select = mockSelect;

    service = new OtpService(
      drizzle as unknown as DrizzleService,
      hashingService as unknown as HashingService,
      i18n as unknown as I18nService,
    );
  });

  describe('getActiveOtpExpiry', () => {
    it('returns future expiry when an active OTP exists', async () => {
      const expiresAt = new Date(Date.now() + 3 * 60 * 1000);
      mockLimit.mockResolvedValue([{ expiresAt }]);

      const result = await service.getActiveOtpExpiry(
        'user-1',
        OtpPurpose.ACCOUNT_VERIFICATION,
      );

      expect(result).toEqual(expiresAt);
    });

    it('returns null when no active OTP exists', async () => {
      mockLimit.mockResolvedValue([]);

      const result = await service.getActiveOtpExpiry(
        'user-1',
        OtpPurpose.ACCOUNT_VERIFICATION,
      );

      expect(result).toBeNull();
    });
  });

  describe('createOtp', () => {
    it('sets expiresAt approximately OTP_EXPIRY_MINUTES from now', async () => {
      const insert = jest.fn().mockResolvedValue(undefined);
      const deleteWhere = jest.fn().mockResolvedValue(undefined);
      const deleteFn = jest.fn().mockReturnValue({ where: deleteWhere });
      const conn = {
        delete: deleteFn,
        insert: jest.fn().mockReturnValue({ values: insert }),
      };

      drizzle.transaction.mockImplementation(
        async (fn: (c: typeof conn) => Promise<void>) => {
          await fn(conn);
        },
      );

      const before = Date.now();
      const { expiresAt } = await service.createOtp(
        'user-1',
        OtpPurpose.ACCOUNT_VERIFICATION,
      );
      const after = Date.now();

      const expectedMs = OTP_EXPIRY_MINUTES * 60 * 1000;
      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(
        before + expectedMs - 1000,
      );
      expect(expiresAt.getTime()).toBeLessThanOrEqual(
        after + expectedMs + 1000,
      );
    });
  });
});
