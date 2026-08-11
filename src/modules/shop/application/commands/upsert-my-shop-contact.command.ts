import { Injectable } from '@nestjs/common';
import type { UpdateShopContactDto } from '../../controllers/dto/update-shop-contact.dto';
import type { LocalizedShopDetails } from '../../mappers/shop.mapper';
import { ShopProfileSectionService } from '../shop-profile-section.service';
import { ShopRepository } from '../../repositories/shop.repository';

@Injectable()
export class UpsertMyShopContactCommand {
  constructor(
    private readonly shopProfileSectionService: ShopProfileSectionService,
    private readonly shopRepository: ShopRepository,
  ) {}

  execute(
    shopId: string,
    dto: UpdateShopContactDto,
    lang: string,
  ): Promise<LocalizedShopDetails> {
    return this.shopProfileSectionService.updateSection(
      shopId,
      lang,
      async (tx) => {
        await this.shopRepository.upsertShopContact(
          shopId,
          {
            ...(dto.businessEmail !== undefined && {
              businessEmail: dto.businessEmail,
            }),
            ...(dto.phone !== undefined && { phone: dto.phone }),
            ...(dto.alternativePhone !== undefined && {
              alternativePhone: dto.alternativePhone,
            }),
            ...(dto.whatsapp !== undefined && { whatsapp: dto.whatsapp }),
            ...(dto.telegram !== undefined && { telegram: dto.telegram }),
            ...(dto.facebook !== undefined && { facebook: dto.facebook }),
            ...(dto.instagram !== undefined && { instagram: dto.instagram }),
            ...(dto.x !== undefined && { x: dto.x }),
          },
          tx,
        );
      },
    );
  }
}
