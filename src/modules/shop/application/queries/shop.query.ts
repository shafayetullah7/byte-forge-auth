import { Injectable } from '@nestjs/common';
import { ShopRepository } from '../../repositories/shop.repository';

/**
 * Cross-module read facade for catalog, guards, notifications, and order callers.
 */
@Injectable()
export class ShopQueryService {
  constructor(private readonly shopRepository: ShopRepository) {}

  getShopByOwnerId(ownerId: string) {
    return this.shopRepository.getShopByOwnerId(ownerId);
  }

  getShopById(id: string) {
    return this.shopRepository.getShopById(id);
  }

  getShopBySlug(slug: string) {
    return this.shopRepository.getShopBySlug(slug);
  }

  getShopContactByShopId(shopId: string) {
    return this.shopRepository.getShopContactByShopId(shopId);
  }
}
