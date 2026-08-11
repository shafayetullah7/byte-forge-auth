import { Injectable } from '@nestjs/common';
import { WishlistRepository } from '../../repositories/wishlist.repository';

@Injectable()
export class RemoveWishlistItemCommand {
  constructor(private readonly wishlistRepository: WishlistRepository) {}

  async execute(userId: string, variantId: string) {
    const removed = await this.wishlistRepository.removeItem(userId, variantId);
    return { removed: removed.length > 0, variantId };
  }
}
