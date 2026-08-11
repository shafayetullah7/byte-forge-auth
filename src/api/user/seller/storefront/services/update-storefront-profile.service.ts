import { Injectable, BadRequestException } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { ShopRepository } from '@/modules/shop/repositories';
import { UpdateStorefrontProfileDto } from '../dto/update-storefront-profile.dto';
import { GetStorefrontService } from './get-storefront.service';

@Injectable()
export class UpdateStorefrontProfileService {
  constructor(
    private readonly db: DrizzleService,
    private readonly shopRepository: ShopRepository,
    private readonly getStorefrontService: GetStorefrontService,
  ) {}

  async execute(shopId: string, dto: UpdateStorefrontProfileDto, lang: string) {
    await this.db.transaction(async (tx) => {
      const existing =
        await this.shopRepository.getShopWithTranslations(shopId);

      for (const locale of ['en', 'bn'] as const) {
        const translation = dto.translations[locale];
        const current = existing?.translations?.find(
          (t) => t.locale === locale,
        );

        if (!current?.name) {
          throw new BadRequestException('Shop translation missing');
        }

        await this.shopRepository.upsertShopTranslation(
          {
            shopId,
            locale,
            name: current.name,
            description: current.description,
            businessHours: current.businessHours,
            tagline: translation.tagline || null,
            about: translation.about || null,
            sellerStory: translation.sellerStory || null,
            brandMission: translation.brandMission || null,
          },
          tx,
        );
      }
    });

    return this.getStorefrontService.execute(shopId, lang);
  }
}
