import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { createLocalAdminSchema } from './create.local.admin.dto';

const completeLocalAdminSchema = createLocalAdminSchema.extend({
  otp: z
    .string()
    .length(6, { message: 'message.otp.invalidLength' })
    .regex(/^\d+$/, { message: 'message.otp.invalidFormat' }),
});

export class CompleteLocalAdminDto extends createZodDto(
  completeLocalAdminSchema,
) {}
