import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UUIDSchema = z.string().uuid({ message: 'Invalid UUID format' });

export const AddressIdParamsSchema = z.object({
  id: UUIDSchema,
});

export class AddressIdParamsDto extends createZodDto(AddressIdParamsSchema) {}
