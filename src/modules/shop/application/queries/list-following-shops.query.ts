import { Injectable } from '@nestjs/common';
import { resolveTranslation } from '@/libs/utils/resolve-translation.util';
import type { TShopTranslation } from '@/_db/drizzle/schema/shop';
import { ShopFollowRepository } from '../../repositories/shop-follow.repository';

@Injectable()
export class ListFollowingShopsQuery {
  constructor(private readonly shopFollowRepository: ShopFollowRepository) {}

  async execute(userId: string, lang: string) {
    const rows = await this.shopFollowRepository.listFollowingByUserId(userId);

    return rows.map((row) => {
      const shop = row.shop;
      const translation = resolveTranslation<TShopTranslation>(
        shop.translations,
        lang,
      );

      return {
        followedAt: row.createdAt,
        shop: {
          id: shop.id,
          slug: shop.slug,
          name: translation?.name ?? '',
          tagline: translation?.tagline ?? null,
          isVerified: shop.isVerified,
          logo: shop.logo ? { id: shop.logo.id, url: shop.logo.url } : null,
          banner: shop.banner
            ? { id: shop.banner.id, url: shop.banner.url }
            : null,
        },
      };
    });
  }
}
