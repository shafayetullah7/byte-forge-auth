import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ShopFollowRepository } from '@/_repositories/business/shop-follow.repository/shop-follow.repository';
import { ShopRepository } from '@/modules/shop/repositories';
import { ShopStatusEnum } from '@/_db/drizzle/enum';
import { resolveTranslation } from '@/common/utils/resolve-translation.util';
import type { TShopTranslation } from '@/_db/drizzle/schema/shop';

@Injectable()
export class ShopFollowService {
  constructor(
    private readonly shopFollowRepository: ShopFollowRepository,
    private readonly shopRepository: ShopRepository,
  ) {}

  async follow(userId: string, slug: string) {
    const shop = await this.assertFollowableShop(slug, userId);
    const row = await this.shopFollowRepository.follow(shop.id, userId);

    return {
      shopId: shop.id,
      slug: shop.slug,
      followedAt: row?.createdAt ?? null,
    };
  }

  async unfollow(userId: string, slug: string) {
    const shop = await this.shopRepository.getShopBySlug(slug);
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    await this.shopFollowRepository.unfollow(shop.id, userId);

    return { shopId: shop.id, slug: shop.slug };
  }

  async listFollowing(userId: string, lang: string) {
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

  private async assertFollowableShop(slug: string, userId: string) {
    const shop = await this.shopRepository.getShopBySlug(slug);

    if (!shop || shop.status !== ShopStatusEnum.ACTIVE) {
      throw new NotFoundException('Shop not found');
    }

    if (!shop.isVerified) {
      throw new BadRequestException('Shop is not verified');
    }

    if (shop.ownerId === userId) {
      throw new BadRequestException('Cannot follow your own shop');
    }

    return shop;
  }
}
