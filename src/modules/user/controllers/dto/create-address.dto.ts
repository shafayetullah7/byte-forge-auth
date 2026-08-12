import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { AddressTypeEnum } from '@/_db/drizzle/enum';

const PHONE_PATTERN = /^\+?[1-9]\d{1,14}$/;
const POSTAL_CODE_PATTERN = /^\d{4,10}$/;
// const COMPANY_NAME_PATTERN = /^[a-zA-Z0-9\s\u0980-\u09FF\.\-\&\(\)\,]+$/;

export const CreateAddressSchema = z.object({
  type: z.nativeEnum(AddressTypeEnum).default(AddressTypeEnum.SHIPPING),
  label: z
    .string()
    .trim()
    .min(1, 'Label is required')
    .max(50, 'Label cannot exceed 50 characters'),
  recipientName: z
    .string()
    .trim()
    .min(1, 'Recipient name is required')
    .max(100, 'Recipient name cannot exceed 100 characters'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .max(20, 'Phone number cannot exceed 20 characters')
    .regex(PHONE_PATTERN, 'Phone number must be a valid phone number'),
  addressLine1: z
    .string()
    .trim()
    .min(1, 'Address line 1 is required')
    .max(255, 'Address line 1 cannot exceed 255 characters'),
  addressLine2: z
    .string()
    .trim()
    .max(255, 'Address line 2 cannot exceed 255 characters')
    .optional()
    .nullable(),
  districtId: z.string().uuid('District ID is required'),
  divisionId: z.string().uuid('Division ID is required'),
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
    .min(1, 'Country is required')
    .max(100, 'Country cannot exceed 100 characters')
    .default('Bangladesh'),
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
  isDefault: z.boolean().default(false),
});

export class CreateAddressDto extends createZodDto(CreateAddressSchema) {}
