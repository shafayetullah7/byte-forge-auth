import { ConflictException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { CreateLocalUserDto } from '../controllers/dto/create-local-user.dto';
import { UserLocalAuthService } from './user-local-auth.service';
import { CreateUserCommand } from '@/modules/user/application/commands/create-user.command';
import { UserQueryService } from '@/modules/user/application/queries/user.query';
import { DeviceInfo, TSession, TUser, userTable } from '@/_db/drizzle/schema';
import { UserSessionRepository } from '../repositories/user-session.repository';
import { SessionRepository } from '../repositories/session.repository';
import { OtpService } from '@/libs/modules/otp/otp.service';
import {
  AccountVerificationEmailSendEvent,
  EmailEventNames,
} from '@/libs/modules/events/events';
import { OtpPurpose } from '@/_db/drizzle/enum/otp.purpose.enum';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { UserLocalAuthRepository } from '../repositories/user-local-auth.repository';

import { HashingService } from '@/libs/modules/hashing/hashing.service';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class UserAuthService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly userLocalAuthService: UserLocalAuthService,
    private readonly createUserCommand: CreateUserCommand,
    private readonly userQueryService: UserQueryService,
    private readonly userSessionRepository: UserSessionRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly otpService: OtpService,
    private readonly userLocalAuthRepository: UserLocalAuthRepository,
    private readonly eventEmitter: EventEmitter2,

    private readonly hashingService: HashingService,
    private readonly i18n: I18nService,
  ) {}

  async register(payload: CreateLocalUserDto, lang: string = 'en') {
    const { email, password, firstName, lastName, userName } = payload;

    // Check if username already exists using UserRepository
    const existingUserByUsername =
      await this.userQueryService.findByUserName(userName);
    if (existingUserByUsername) {
      throw new CustomException({
        message: this.i18n.t('message.error.usernameExists', { lang }),
        statusCode: HttpStatus.CONFLICT,
        errorCode: ErrorCode.DUPLICATE_ENTRY,
      });
    }

    // Check if email already exists using UserLocalAuthRepository
    const existingUserByEmail = await this.userLocalAuthRepository.findOne({
      email,
    });
    if (existingUserByEmail) {
      throw new CustomException({
        message: this.i18n.t('message.error.emailExists', { lang }),
        statusCode: HttpStatus.CONFLICT,
        errorCode: ErrorCode.DUPLICATE_ENTRY,
      });
    }

    // Create user in transaction
    try {
      const result = await this.drizzle.client.transaction(async (tx) => {
        const user = await this.createUserCommand.execute(
          {
            firstName,
            lastName,
            userName,
          },
          tx,
        );
        const localAuth = await this.userLocalAuthService.createUserLocalAuth(
          { email, password, userId: user.id },
          tx,
        );

        return { user, localAuth };
      });

      return result;
    } catch (error) {
      // Handle ConflictException from service layer (race condition fallback)
      if (error instanceof ConflictException) {
        throw new CustomException({
          message: error.message,
          statusCode: HttpStatus.CONFLICT,
          errorCode: ErrorCode.DUPLICATE_ENTRY,
        });
      }

      // Re-throw other errors
      throw error;
    }
  }

  async validateCredentials(
    payload: {
      email: string;
      password: string;
    },
    lang: string = 'en',
  ) {
    const user = await this.userLocalAuthService.getLocalUser({
      email: payload.email,
    });

    if (!user) {
      throw new CustomException({
        message: this.i18n.t('message.error.userNotFound', { lang }),
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: ErrorCode.NOT_FOUND,
      });
    }

    const passMatch = await this.hashingService.compare(
      payload.password,
      user.userLocalAuth.password,
    );

    if (!passMatch) {
      throw new CustomException({
        message: this.i18n.t('message.error.invalidPassword', { lang }),
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: ErrorCode.INVALID_CREDENTIALS,
      });
    }

    return user;
  }

  async login(payload: {
    user: TUser;
    deviceInfo: DeviceInfo;
    ip: string;
  }): Promise<TSession> {
    const result = await this.drizzle.transaction(async (tx) => {
      const { user, deviceInfo, ip } = payload;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // now + 7 days

      const sessionData = {
        deviceInfo,
        ip,
        expiresAt,
      };

      const newSession = await this.sessionRepository.create(sessionData, tx);
      const userSessionData = {
        sessionId: newSession.id,
        userId: user.id,
      };
      await this.userSessionRepository.createUserSession(userSessionData, tx);

      return newSession;
    });

    return result;
  }

  async verifyEmail(userId: string, otp: string): Promise<void> {
    await this.drizzle.client.transaction(async (tx) => {
      // Check if already verified to handle race conditions/redundant requests
      const user = await this.userQueryService.findById(userId, {
        tx,
        lock: true,
      });

      if (user?.emailVerifiedAt) {
        throw new CustomException({
          message: this.i18n.t('message.error.emailAlreadyVerified'),
          statusCode: HttpStatus.CONFLICT,
          errorCode: ErrorCode.EMAIL_ALREADY_VERIFIED,
        });
      }

      // Verify OTP (Pass transaction context tx to prevent deadlocks)
      await this.otpService.verifyOtp(
        userId,
        otp,
        OtpPurpose.ACCOUNT_VERIFICATION,
        tx,
      );

      // Update user's emailVerifiedAt (Use transaction context tx!)
      await tx
        .update(userTable)
        .set({ emailVerifiedAt: new Date() })
        .where(eq(userTable.id, userId));
    });
  }

  async sendAccountVerificationOtp(
    userId: string,
    lang: string = 'en',
    options?: { force?: boolean },
  ): Promise<{ expiresAt: Date; sent: boolean }> {
    const [user] = await this.drizzle.client
      .select({
        id: userTable.id,
        emailVerifiedAt: userTable.emailVerifiedAt,
      })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    if (!user) {
      throw new CustomException({
        message: this.i18n.t('message.error.userNotFound', { lang }),
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: ErrorCode.NOT_FOUND,
      });
    }

    if (user.emailVerifiedAt) {
      throw new CustomException({
        message: this.i18n.t('message.error.emailAlreadyVerified', { lang }),
        statusCode: HttpStatus.CONFLICT,
        errorCode: ErrorCode.EMAIL_ALREADY_VERIFIED,
      });
    }

    if (!options?.force) {
      const existing = await this.otpService.getActiveOtpExpiry(
        userId,
        OtpPurpose.ACCOUNT_VERIFICATION,
      );
      if (existing) {
        return { expiresAt: existing, sent: false };
      }
    }

    const localUser = await this.userLocalAuthService.getLocalUser({
      id: userId,
    });

    if (!localUser) {
      throw new CustomException({
        message: this.i18n.t('message.error.userEmailNotFound', { lang }),
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: ErrorCode.NOT_FOUND,
      });
    }

    const { otp, expiresAt } = await this.otpService.createOtp(
      userId,
      OtpPurpose.ACCOUNT_VERIFICATION,
    );

    this.eventEmitter.emit(
      EmailEventNames.ACCOUNT_VERIFICATION_SEND,
      new AccountVerificationEmailSendEvent({
        to: localUser.userLocalAuth.email,
        otp,
        lang,
      }),
    );

    return { expiresAt, sent: true };
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionRepository.update(
      {
        revoked: true,
        logoutAt: new Date(),
      },
      { id: sessionId },
    );
  }
}
