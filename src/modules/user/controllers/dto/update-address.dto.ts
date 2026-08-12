import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { AddressTypeEnum } from '@/_db/drizzle/enum';

const PHONE_PATTERN = /^\+?[1-9]\d{1,14}$/;
const POSTAL_CODE_PATTERN = /^\d{4,10}$/;

export const UpdateAddressSchema = z.object({
  type: z.nativeEnum(AddressTypeEnum).optional(),
  label: z
    .string()
    .trim()
    .min(1, 'Label cannot be empty')
    .max(50, 'Label cannot exceed 50 characters')
    .optional(),
  recipientName: z
    .string()
    .trim()
    .min(1, 'Recipient name cannot be empty')
    .max(100, 'Recipient name cannot exceed 100 characters')
    .optional(),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone cannot be empty')
    .max(20, 'Phone number cannot exceed 20 characters')
    .regex(PHONE_PATTERN, 'Phone number must be a valid phone number')
    .optional(),
  addressLine1: z
    .string()
    .trim()
    .min(1, 'Address line 1 cannot be empty')
    .max(255, 'Address line 1 cannot exceed 255 characters')
    .optional(),
  addressLine2: z
    .string()
    .trim()
    .max(255, 'Address line 2 cannot exceed 255 characters')
    .optional()
    .nullable(),
  districtId: z.string().uuid('District ID must be a valid UUID').optional(),
  divisionId: z.string().uuid('Division ID must be a valid UUID').optional(),
  postalCode: z
    .string()
    .trim()
    .max(20, 'Postal code cannot exceed 20 characters')
    .regex(POSTAL_CODE_PATTERN, 'Postal code must contain only digits')
    .optional()
    .nullable(),
  country: z
    .string()
    .trim()
    .min(1, 'Country cannot be empty')
    .max(100, 'Country cannot exceed 100 characters')
    .optional(),
  companyName: z
    .string()
    .trim()
    .max(255, 'Company name cannot exceed 255 characters')
    .optional()
    .nullable(),
  deliveryInstructions: z
    .string()
    .trim()
    .max(1000, 'Delivery instructions cannot exceed 1000 characters')
    .optional()
    .nullable(),
  billingNotes: z
    .string()
    .trim()
    .max(1000, 'Billing notes cannot exceed 1000 characters')
    .optional()
    .nullable(),
  isDefault: z.boolean().optional(),
});

export class UpdateAddressDto extends createZodDto(UpdateAddressSchema) {}
