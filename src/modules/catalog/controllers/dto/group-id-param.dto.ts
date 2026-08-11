import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const groupIdParamSchema = z.object({
  groupId: z.uuid({ message: 'Invalid UUID format for Group ID parameter' }),
});

export class GroupIdParamDto extends createZodDto(groupIdParamSchema) {}
