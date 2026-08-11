import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ShopStatusEnum } from '@/_db/drizzle/enum';
import { ShopFollowRepository } from '../../repositories/shop-follow.repository';
import { ShopRepository } from '../../repositories/shop.repository';

@Injectable()
export class FollowShopCommand {
  constructor(
    private readonly shopFollowRepository: ShopFollowRepository,
    private readonly shopRepository: ShopRepository,
  ) {}

  async execute(userId: string, slug: string) {
    const shop = await this.assertFollowableShop(slug, userId);
    const row = await this.shopFollowRepository.follow(shop.id, userId);

    return {
      shopId: shop.id,
      slug: shop.slug,
      followedAt: row?.createdAt ?? null,
    };
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
