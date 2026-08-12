import { Injectable, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';
import { UserLocalAuthRepository } from '../repositories/user-local-auth.repository';
import { OtpService } from '@/libs/modules/otp/otp.service';
import { HashingService } from '@/libs/modules/hashing/hashing.service';
import { OtpPurpose } from '@/_db/drizzle/enum/otp.purpose.enum';
import { I18nService } from 'nestjs-i18n';
import {
  EmailEventNames,
  PasswordResetEmailSendEvent,
} from '@/libs/modules/events/events';

export interface ResetTokenPayload {
  email: string;
  purpose: 'reset-request' | 'reset-access';
}

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userLocalAuthRepository: UserLocalAuthRepository,
    private readonly otpService: OtpService,
    private readonly eventEmitter: EventEmitter2,
    private readonly hashingService: HashingService,
    private readonly i18n: I18nService,
  ) {}

  // === Token Logic ===

  async generateRequestToken(
    email: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    const secret = this.configService.getOrThrow<string>(
      'JWT_SECRET_RESET_REQUEST',
    );
    const expiresIn = '10m';

    const payload: ResetTokenPayload = { email, purpose: 'reset-request' };
    const token = await this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
    });
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    return { token, expiresAt };
  }

  async verifyRequestToken(
    token: string,
    lang: string = 'en',
  ): Promise<string> {
    const secret = this.configService.getOrThrow<string>(
      'JWT_SECRET_RESET_REQUEST',
    );
    try {
      const payload = await this.jwtService.verifyAsync<ResetTokenPayload>(
        token,
        { secret },
      );

      if (payload.purpose !== 'reset-request') {
        throw new Error('Invalid token purpose');
      }

      return payload.email;
    } catch {
      throw new CustomException({
        message: this.i18n.t('message.error.invalidRequestToken', { lang }),
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: ErrorCode.UNAUTHORIZED,
      });
    }
  }

  async generateAccessToken(
    email: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    const secret = this.configService.getOrThrow<string>(
      'JWT_SECRET_RESET_ACCESS',
    );
    const expiresIn = '5m';

    const payload: ResetTokenPayload = { email, purpose: 'reset-access' };
    const token = await this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
    });
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    return { token, expiresAt };
  }

  async verifyAccessToken(token: string, lang: string = 'en'): Promise<string> {
    const secret = this.configService.getOrThrow<string>(
      'JWT_SECRET_RESET_ACCESS',
    );
    try {
      const payload = await this.jwtService.verifyAsync<ResetTokenPayload>(
        token,
        { secret },
      );

      if (payload.purpose !== 'reset-access') {
        throw new Error('Invalid token purpose');
      }

      return payload.email;
    } catch {
      throw new CustomException({
        message: this.i18n.t('message.error.invalidAccessToken', { lang }),
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: ErrorCode.UNAUTHORIZED,
      });
    }
  }

  // === Business Logic ===

  async forgotPassword(
    email: string,
    lang: string = 'en',
  ): Promise<{ token: string; expiresAt: Date }> {
    // 1. Check if user exists
    const userLocalAuth = await this.userLocalAuthRepository.findOne({ email });

    // 2. If user exists, generate OTP and send email
    if (userLocalAuth) {
      const { otp } = await this.otpService.createOtp(
        userLocalAuth.userId,
        OtpPurpose.PASSWORD_RESET,
      );

      this.eventEmitter.emit(
        EmailEventNames.PASSWORD_RESET_SEND,
        new PasswordResetEmailSendEvent({ to: email, otp, lang }),
      );
    } else {
      // Security: Simulate work to mitigate timing attacks (optional/advanced)
      // For now, we simply do not send the email but proceed to generate a token
      // This allows the frontend to transition to the verify page without revealing user existence
    }

    // 3. Generate Request Token (Always return a token so frontend flow continues)
    return this.generateRequestToken(email);
  }

  async verifyResetOtp(
    token: string,
    otp: string,
    lang: string = 'en',
  ): Promise<{ token: string; expiresAt: Date }> {
    // 1. Verify Request Token
    const email = await this.verifyRequestToken(token, lang);

    // 2. Get User ID
    const userLocalAuth = await this.userLocalAuthRepository.findOne({ email });
    if (!userLocalAuth) {
      // Security: Mask user existence. Throw same error as invalid OTP.
      throw new CustomException({
        message: this.i18n.t('message.error.invalidOtp', { lang }),
        statusCode: HttpStatus.BAD_REQUEST, // Match valid-user-wrong-otp status
        errorCode: ErrorCode.INVALID_OTP,
      });
    }

    // 3. Verify OTP
    await this.otpService.verifyOtp(
      userLocalAuth.userId,
      otp,
      OtpPurpose.PASSWORD_RESET,
    );

    // 4. Generate Access Token
    return this.generateAccessToken(email);
  }

  async resendResetOtp(
    token: string,
    lang: string = 'en',
  ): Promise<{ token: string; expiresAt: Date }> {
    // 1. Verify Request Token
    const email = await this.verifyRequestToken(token, lang);

    // 2. Get User ID
    const userLocalAuth = await this.userLocalAuthRepository.findOne({ email });

    if (userLocalAuth) {
      const { otp } = await this.otpService.createOtp(
        userLocalAuth.userId,
        OtpPurpose.PASSWORD_RESET,
      );

      this.eventEmitter.emit(
        EmailEventNames.PASSWORD_RESET_SEND,
        new PasswordResetEmailSendEvent({ to: email, otp, lang }),
      );
    }

    // 5. Generate NEW Request Token (Always return to keep flow alive)
    return this.generateRequestToken(email);
  }

  async resetPassword(
    token: string,
    password: string,
    lang: string = 'en',
  ): Promise<void> {
    // 1. Verify Access Token
    const email = await this.verifyAccessToken(token, lang);

    // 2. Hash New Password
    const hashedPassword = await this.hashingService.hash(password);

    // 3. Update User Password
    const userLocalAuth = await this.userLocalAuthRepository.findOne({ email });
    if (!userLocalAuth) {
      throw new CustomException({
        message: this.i18n.t('message.error.userNotFound', { lang }),
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: ErrorCode.UNAUTHORIZED,
      });
    }

    await this.userLocalAuthRepository.update(
      { password: hashedPassword },
      { id: userLocalAuth.id },
    );
  }
}
