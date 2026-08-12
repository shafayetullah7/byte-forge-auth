import { Body, Controller, Post } from '@nestjs/common';
import {
  ForgotPasswordDto,
  ResendResetOtpDto,
  ResetPasswordDto,
  VerifyResetOtpDto,
} from './dto/password-reset.dto';
import { PasswordResetService } from '../application/password-reset.service';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseService } from '@/libs/modules/response/response.service';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@/libs/decorators/api-error.decorator';

@ApiTags('🔐 Password Reset')
@Controller({ path: 'user/password-reset', version: '1' })
export class PasswordResetController {
  constructor(
    private readonly passwordResetService: PasswordResetService,
    private readonly i18n: I18nService,
    private readonly responseService: ResponseService,
  ) {}

  @ApiOperation({
    summary: 'Request password reset',
    description: 'Sends a password reset OTP to the user email.',
  })
  @ApiResponse({ status: 200, description: 'Password reset OTP sent' })
  @ApiNotFoundResponse('User')
  @Post('forgot')
  async forgotPassword(@Body() payload: ForgotPasswordDto) {
    const i18nContext = I18nContext.current();
    const lang = i18nContext ? i18nContext.lang : 'en';
    const result = await this.passwordResetService.forgotPassword(
      payload.email,
      lang,
    );
    return this.responseService.success({
      message: this.i18n.t('message.success.passwordResetRequested', { lang }),
      data: result,
    });
  }

  @ApiOperation({
    summary: 'Verify password reset OTP',
    description: 'Verifies the OTP token for password reset.',
  })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiBadRequestResponse('INVALID_OTP')
  @Post('verify')
  async verifyResetOtp(@Body() payload: VerifyResetOtpDto) {
    const i18nContext = I18nContext.current();
    const lang = i18nContext ? i18nContext.lang : 'en';
    const result = await this.passwordResetService.verifyResetOtp(
      payload.token,
      payload.otp,
    );
    return this.responseService.success({
      message: this.i18n.t('message.success.otpVerified', { lang }),
      data: result,
    });
  }

  @ApiOperation({
    summary: 'Resend password reset OTP',
    description: 'Resends the password reset OTP.',
  })
  @ApiResponse({ status: 200, description: 'OTP resent successfully' })
  @ApiBadRequestResponse('INVALID_TOKEN')
  @Post('resend')
  async resendResetOtp(@Body() payload: ResendResetOtpDto) {
    const i18nContext = I18nContext.current();
    const lang = i18nContext ? i18nContext.lang : 'en';
    const result = await this.passwordResetService.resendResetOtp(
      payload.token,
      lang,
    );
    return this.responseService.success({
      message: this.i18n.t('message.success.otpResent', { lang }),
      data: result,
    });
  }

  @ApiOperation({
    summary: 'Reset password with new password',
    description: 'Sets a new password using the verified token.',
  })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiBadRequestResponse('INVALID_TOKEN_OR_PASSWORD')
  @Post('reset')
  async resetPassword(@Body() payload: ResetPasswordDto) {
    const i18nContext = I18nContext.current();
    const lang = i18nContext ? i18nContext.lang : 'en';
    await this.passwordResetService.resetPassword(
      payload.token,
      payload.password,
    );
    return this.responseService.success({
      message: this.i18n.t('message.success.passwordReset', { lang }),
      data: null,
    });
  }
}
