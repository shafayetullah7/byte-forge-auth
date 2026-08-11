import { Injectable } from '@nestjs/common';
import { mapWishlistItem } from '../../mappers/wishlist.mapper';
import { WishlistRepository } from '../../repositories/wishlist.repository';

@Injectable()
export class ListWishlistQuery {
  constructor(private readonly wishlistRepository: WishlistRepository) {}

  async execute(userId: string, lang: string) {
    const items = await this.wishlistRepository.listItems(userId);
    return items.map((item) => mapWishlistItem(item, lang));
  }
}
