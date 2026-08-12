import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { SlugSchema } from '@/common/schemas/slug.schema';
import { ShopCampaignTypeEnum } from '@/_db/drizzle/enum';
import { campaignTranslationsSchema } from './create-campaign.dto';

const campaignDateSchema = z.string().datetime({ offset: true });

export const updateCampaignSchema = z
  .object({
    slug: SlugSchema.optional(),
    type: z.nativeEnum(ShopCampaignTypeEnum).optional(),
    bannerId: z.string().uuid().optional().nullable(),
    discountPercent: z.coerce
      .number()
      .int()
      .min(0)
      .max(100)
      .optional()
      .nullable(),
    startDate: campaignDateSchema.optional(),
    endDate: campaignDateSchema.optional(),
    productIds: z.array(z.uuid()).max(50).optional(),
    translations: campaignTranslationsSchema.partial().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    { message: 'End date must be after start date', path: ['endDate'] },
  );

export class UpdateCampaignDto extends createZodDto(updateCampaignSchema) {}
