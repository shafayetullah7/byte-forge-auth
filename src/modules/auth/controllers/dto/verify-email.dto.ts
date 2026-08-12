import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const verifyEmailSchema = z.object({
  otp: z
    .string()
    .length(6, { message: 'message.otp.invalidLength' })
    .regex(/^\d+$/, { message: 'message.otp.invalidFormat' }),
});

export class VerifyEmailDto extends createZodDto(verifyEmailSchema) {}
