import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { HashingService } from '../hashing/hashing.service';
import { otpTable } from '@/_db/drizzle/schema';
import { DrizzleTx } from '@/_db/drizzle/types';
import { OtpPurpose } from '@/_db/drizzle/enum/otp.purpose.enum';
import { and, eq, gt } from 'drizzle-orm';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { ErrorCode } from '../response/dto/error.schema';
import { HttpStatus } from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { OTP_EXPIRY_MINUTES } from './otp.constants';

@Injectable()
export class OtpService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly hashingService: HashingService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Generate a 6-digit numeric OTP
   */
  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async getActiveOtpExpiry(
    userId: string,
    purpose: OtpPurpose,
  ): Promise<Date | null> {
    const [otpRecord] = await this.drizzle.client
      .select({ expiresAt: otpTable.expiresAt })
      .from(otpTable)
      .where(
        and(
          eq(otpTable.userId, userId),
          eq(otpTable.purpose, purpose),
          gt(otpTable.expiresAt, new Date()),
        ),
      )
      .limit(1);

    return otpRecord?.expiresAt ?? null;
  }

  /**
   * Create and store a hashed OTP for a user
   */
  async createOtp(
    userId: string,
    purpose: OtpPurpose,
    tx?: DrizzleTx,
  ): Promise<{ otp: string; expiresAt: Date }> {
    const otp = this.generateOtp();
    const hashedOtp = await this.hashingService.hash(otp);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    const executeLogic = async (conn: DrizzleTx) => {
      await conn
        .delete(otpTable)
        .where(and(eq(otpTable.userId, userId), eq(otpTable.purpose, purpose)));

      await conn.insert(otpTable).values({
        userId,
        hashedOtp,
        purpose,
        expiresAt,
      });
    };

    if (tx) {
      await executeLogic(tx);
    } else {
      await this.drizzle.transaction(executeLogic);
    }

    return { otp, expiresAt };
  }

  /**
   * Verify an OTP for a user
   */
  async verifyOtp(
    userId: string,
    otp: string,
    purpose: OtpPurpose,
    tx?: DrizzleTx,
  ): Promise<boolean> {
    const i18nContext = I18nContext.current();
    const lang = i18nContext ? i18nContext.lang : 'en';

    if (!/^\d+$/.test(otp)) {
      throw new CustomException({
        message: this.i18n.t('message.error.invalidOtp', { lang }),
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.VALIDATION_ERROR,
      });
    }

    const executeLogic = async (conn: DrizzleTx) => {
      const [otpRecord] = await conn
        .select()
        .from(otpTable)
        .where(
          and(
            eq(otpTable.userId, userId),
            eq(otpTable.purpose, purpose),
            gt(otpTable.expiresAt, new Date()),
          ),
        )
        .limit(1)
        .for('update');

      if (!otpRecord) {
        throw new CustomException({
          message: this.i18n.t('message.error.invalidOtp', { lang }),
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: ErrorCode.INVALID_OTP,
        });
      }

      const isValid = await this.hashingService.compare(
        otp,
        otpRecord.hashedOtp,
      );

      if (!isValid) {
        throw new CustomException({
          message: this.i18n.t('message.error.invalidOtp', { lang }),
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: ErrorCode.INVALID_OTP,
        });
      }

      await conn.delete(otpTable).where(eq(otpTable.id, otpRecord.id));

      return true;
    };

    if (tx) {
      return await executeLogic(tx);
    } else {
      return await this.drizzle.transaction(executeLogic);
    }
  }
}
