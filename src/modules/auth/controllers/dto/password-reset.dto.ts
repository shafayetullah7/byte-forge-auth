import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email().min(1),
});

export class ForgotPasswordDto extends createZodDto(forgotPasswordSchema) {}

const verifyResetOtpSchema = z.object({
  token: z.string().min(1),
  otp: z.string().min(6),
});

export class VerifyResetOtpDto extends createZodDto(verifyResetOtpSchema) {}

const resendResetOtpSchema = z.object({
  token: z.string().min(1),
});

export class ResendResetOtpDto extends createZodDto(resendResetOtpSchema) {}

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
