import { Injectable } from '@nestjs/common';
import { shopAddressTable } from '@/_db/drizzle/schema/shop/shop.address.schema';
import type { UpdateShopAddressDto } from '../../controllers/dto/update-shop-address.dto';
import type { LocalizedShopDetails } from '../../mappers/shop.mapper';
import { ShopProfileSectionService } from '../shop-profile-section.service';
import { ShopRepository } from '../../repositories/shop.repository';

@Injectable()
export class UpdateMyShopAddressCommand {
  constructor(
    private readonly shopProfileSectionService: ShopProfileSectionService,
    private readonly shopRepository: ShopRepository,
  ) {}

  execute(
    shopId: string,
    dto: UpdateShopAddressDto,
    lang: string,
  ): Promise<LocalizedShopDetails> {
    return this.shopProfileSectionService.updateSection(
      shopId,
      lang,
      async (tx) => {
        const addressPayload: Partial<typeof shopAddressTable.$inferInsert> =
          {};

        if (dto.postalCode !== undefined) {
          addressPayload.postalCode = dto.postalCode;
        }

        if (dto.latitude !== undefined && dto.latitude !== '') {
          const lat = parseFloat(dto.latitude);
          if (!isNaN(lat)) {
            addressPayload.latitude = lat.toFixed(10);
          }
        }

        if (dto.longitude !== undefined && dto.longitude !== '') {
          const lng = parseFloat(dto.longitude);
          if (!isNaN(lng)) {
            addressPayload.longitude = lng.toFixed(10);
          }
        }

        if (dto.googleMapsLink !== undefined) {
          addressPayload.googleMapsLink = dto.googleMapsLink;
        }

        const address = await this.shopRepository.upsertShopAddress(
          shopId,
          Object.keys(addressPayload).length > 0
            ? addressPayload
            : { postalCode: '' },
          tx,
        );

        if (dto.translations) {
          await this.shopRepository.upsertShopAddressTranslation(
            address.id,
            {
              locale: 'en',
              country: dto.translations.en.country,
              division: dto.translations.en.division,
              district: dto.translations.en.district,
              street: dto.translations.en.street,
            },
            tx,
          );

          await this.shopRepository.upsertShopAddressTranslation(
            address.id,
            {
              locale: 'bn',
              country: dto.translations.bn.country,
              division: dto.translations.bn.division,
              district: dto.translations.bn.district,
              street: dto.translations.bn.street,
            },
            tx,
          );
        }
      },
    );
  }
}
