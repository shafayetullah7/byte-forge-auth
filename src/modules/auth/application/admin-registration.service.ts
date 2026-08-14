import { HttpStatus, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { eq } from 'drizzle-orm';
import { I18nService } from 'nestjs-i18n';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { adminTable } from '@/_db/drizzle/schema';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';
import {
  AdminRegistrationOtpEmailSendEvent,
  EmailEventNames,
} from '@/libs/modules/events/events';
import { HashingService } from '@/libs/modules/hashing/hashing.service';
import { OTP_EXPIRY_MINUTES } from '@/libs/modules/otp/otp.constants';
import { OtpService } from '@/libs/modules/otp/otp.service';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';
import { CreateLocalAdminDto } from '../controllers/dto/create.local.admin.dto';
import { AdminLocalAuthRepository } from '../repositories/admin-local-auth.repository';
import { AdminRegistrationPendingRepository } from '../repositories/admin-registration-pending.repository';
import { AdminRegistrationRateLimiterService } from './admin-registration-rate-limiter.service';
import { AdminService } from './admin.service';

export type CompleteAdminRegistrationInput = CreateLocalAdminDto & {
  otp: string;
};

@Injectable()
export class AdminRegistrationService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly adminService: AdminService,
    private readonly adminLocalAuthRepository: AdminLocalAuthRepository,
    private readonly pendingRepository: AdminRegistrationPendingRepository,
    private readonly rateLimiter: AdminRegistrationRateLimiterService,
    private readonly hashingService: HashingService,
    private readonly otpService: OtpService,
    private readonly configService: AppConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly i18n: I18nService,
  ) {}

  async requestRegistrationOtp(
    payload: CreateLocalAdminDto,
    lang: string = 'en',
  ): Promise<{ expiresAt: Date }> {
    const { email, firstName, lastName, password, userName } = payload;

    await this.assertEmailAvailable(email, lang);
    await this.assertUserNameAvailable(userName, email, lang);

    const hashedPassword = await this.hashingService.hash(password);
    const otp = this.otpService.generateOtp();
    const hashedOtp = await this.hashingService.hash(otp);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    await this.drizzle.transaction(async (tx) => {
      await this.rateLimiter.assertCanSendOtp(tx, lang);

      await this.pendingRepository.upsertPendingRegistration(
        {
          email,
          userName,
          firstName,
          lastName,
          hashedPassword,
          hashedOtp,
          expiresAt,
        },
        tx,
      );

      await this.rateLimiter.recordOtpSent(tx);
    });

    this.eventEmitter.emit(
      EmailEventNames.ADMIN_REGISTRATION_OTP_SEND,
      new AdminRegistrationOtpEmailSendEvent({
        to: this.configService.adminRegistrationOtpEmail,
        otp,
        lang,
        registrantEmail: email,
        registrantUserName: userName,
        registrantName: `${firstName} ${lastName}`,
      }),
    );

    return { expiresAt };
  }

  async completeRegistration(
    payload: CompleteAdminRegistrationInput,
    lang: string = 'en',
  ) {
    const pending = await this.pendingRepository.findByEmail(payload.email);

    if (!pending) {
      throw new CustomException({
        message: this.i18n.t('message.error.invalidOtp', { lang }),
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.INVALID_OTP,
      });
    }

    this.assertPayloadMatchesPending(payload, pending, lang);

    const passwordMatches = await this.hashingService.compare(
      payload.password,
      pending.hashedPassword,
    );

    if (!passwordMatches) {
      throw new CustomException({
        message: this.i18n.t('message.error.invalidOtp', { lang }),
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.INVALID_OTP,
      });
    }

    const admin = await this.drizzle.transaction(async (tx) => {
      const lockedPending = await this.pendingRepository.findByEmail(
        payload.email,
        tx,
      );

      if (!lockedPending) {
        throw new CustomException({
          message: this.i18n.t('message.error.invalidOtp', { lang }),
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: ErrorCode.INVALID_OTP,
        });
      }

      await this.verifyPendingOtp(lockedPending, payload.otp, lang);

      const createdAdmin = await this.adminService.createAdmin(
        {
          firstName: lockedPending.firstName,
          lastName: lockedPending.lastName,
          userName: lockedPending.userName,
        },
        tx,
      );

      await this.adminLocalAuthRepository.create(
        {
          adminId: createdAdmin.id,
          email: lockedPending.email,
          password: lockedPending.hashedPassword,
          verfied: true,
        },
        tx,
      );

      await this.pendingRepository.deleteByEmail(lockedPending.email, tx);

      return createdAdmin;
    });

    return admin;
  }

  private async assertEmailAvailable(email: string, lang: string): Promise<void> {
    const existing = await this.adminLocalAuthRepository.findOne({ email });

    if (existing) {
      throw new CustomException({
        message: this.i18n.t('message.error.emailExists', { lang }),
        statusCode: HttpStatus.CONFLICT,
        errorCode: ErrorCode.DUPLICATE_ENTRY,
      });
    }
  }

  private async assertUserNameAvailable(
    userName: string,
    email: string,
    lang: string,
  ): Promise<void> {
    const [existingAdmin] = await this.drizzle.client
      .select({ id: adminTable.id })
      .from(adminTable)
      .where(eq(adminTable.userName, userName))
      .limit(1);

    if (existingAdmin) {
      throw new CustomException({
        message: this.i18n.t('message.error.usernameExists', { lang }),
        statusCode: HttpStatus.CONFLICT,
        errorCode: ErrorCode.DUPLICATE_ENTRY,
      });
    }

    const pendingConflict =
      await this.pendingRepository.findByUserNameExcludingEmail(
        userName,
        email,
      );

    if (pendingConflict) {
      throw new CustomException({
        message: this.i18n.t('message.error.usernameExists', { lang }),
        statusCode: HttpStatus.CONFLICT,
        errorCode: ErrorCode.DUPLICATE_ENTRY,
      });
    }
  }

  private assertPayloadMatchesPending(
    payload: CompleteAdminRegistrationInput,
    pending: {
      firstName: string;
      lastName: string;
      userName: string;
    },
    lang: string,
  ): void {
    const mismatch =
      payload.firstName !== pending.firstName ||
      payload.lastName !== pending.lastName ||
      payload.userName !== pending.userName;

    if (mismatch) {
      throw new CustomException({
        message: this.i18n.t('message.error.invalidOtp', { lang }),
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.INVALID_OTP,
      });
    }
  }

  private async verifyPendingOtp(
    pending: { hashedOtp: string; expiresAt: Date },
    otp: string,
    lang: string,
  ): Promise<void> {
    if (!/^\d{6}$/.test(otp)) {
      throw new CustomException({
        message: this.i18n.t('message.error.invalidOtp', { lang }),
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.INVALID_OTP,
      });
    }

    if (pending.expiresAt.getTime() <= Date.now()) {
      throw new CustomException({
        message: this.i18n.t('message.error.invalidOtp', { lang }),
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.INVALID_OTP,
      });
    }

    const isValid = await this.hashingService.compare(otp, pending.hashedOtp);

    if (!isValid) {
      throw new CustomException({
        message: this.i18n.t('message.error.invalidOtp', { lang }),
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.INVALID_OTP,
      });
    }
  }
}
