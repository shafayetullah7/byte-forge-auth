import { Injectable } from '@nestjs/common';
import type { TMedia } from '@/_db/drizzle/schema';
import { MediaRepository } from '@/modules/media/repositories/media.repository';
import {
  mapToVerificationStatusResponse,
  type VerificationStatusResponse,
} from '../../mappers/verification.mapper';
import { ShopRepository } from '../../repositories/shop.repository';
import { ShopVerificationRepository } from '../../repositories/shop-verification.repository';

@Injectable()
export class GetMyShopVerificationQuery {
  constructor(
    private readonly shopRepository: ShopRepository,
    private readonly shopVerificationRepository: ShopVerificationRepository,
    private readonly mediaRepository: MediaRepository,
  ) {}

  async execute(userId: string): Promise<VerificationStatusResponse | null> {
    const shop = await this.shopRepository.getShopByOwnerId(userId);
    if (!shop) return null;

    const verification = await this.shopVerificationRepository.findOne({
      shopId: shop.id,
    });
    if (!verification) return null;

    const mediaIds = [
      verification.tradeLicenseDocumentId,
      verification.tinDocumentId,
      verification.utilityBillDocumentId,
    ].filter(Boolean) as string[];

    const mediaMap = new Map<string, TMedia>();
    if (mediaIds.length > 0) {
      const medias = await this.mediaRepository.findMediaDetailsByIds(mediaIds);
      medias.forEach((media) => mediaMap.set(media.media.id, media.media));
    }

    return mapToVerificationStatusResponse(verification, mediaMap);
  }
}
