import { ZodDtoFactory } from 'src/common/factories/zod.dto.factory';
import { z } from 'zod';

const UserIdParamsSchema = z.object({
  id: z
    .string({
      required_error: 'User Id is required',
      invalid_type_error: 'User Id must be string',
    })
    .uuid(),
});

export class UserIdParamsDto extends ZodDtoFactory.create(UserIdParamsSchema) {}
