import { Injectable, NotFoundException } from '@nestjs/common';
import { ShopFollowRepository } from '../../repositories/shop-follow.repository';
import { ShopRepository } from '../../repositories/shop.repository';

@Injectable()
export class UnfollowShopCommand {
  constructor(
    private readonly shopFollowRepository: ShopFollowRepository,
    private readonly shopRepository: ShopRepository,
  ) {}

  async execute(userId: string, slug: string) {
    const shop = await this.shopRepository.getShopBySlug(slug);
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    await this.shopFollowRepository.unfollow(shop.id, userId);

    return { shopId: shop.id, slug: shop.slug };
  }
}
