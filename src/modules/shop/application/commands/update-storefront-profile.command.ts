import { BadRequestException, Injectable } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import type { UpdateStorefrontProfileDto } from '../../controllers/dto/update-storefront-profile.dto';
import { ShopRepository } from '../../repositories/shop.repository';
import { GetStorefrontQuery } from '../queries/get-storefront.query';

@Injectable()
export class UpdateStorefrontProfileCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly shopRepository: ShopRepository,
    private readonly getStorefrontQuery: GetStorefrontQuery,
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

    return this.getStorefrontQuery.execute(shopId, lang);
  }
}
