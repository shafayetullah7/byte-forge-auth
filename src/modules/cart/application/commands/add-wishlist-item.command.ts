import { Injectable } from '@nestjs/common';
import { WishlistRepository } from '../../repositories/wishlist.repository';

@Injectable()
export class AddWishlistItemCommand {
  constructor(private readonly wishlistRepository: WishlistRepository) {}

  async execute(userId: string, variantId: string) {
    const item = await this.wishlistRepository.addItem(userId, variantId);
    return {
      id: item?.id ?? null,
      variantId,
      createdAt: item?.createdAt ?? null,
    };
  }
}
