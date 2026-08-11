import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  buildMapSellerOrderContext,
  mapSellerOrder,
} from '@/api/user/seller/orders/seller-orders.mapper';
import type { TAuthorizedShop } from '@/common/types';
import { OrderDomainError } from '../../domain/order.errors';
import type { SellerOrderWithRelations } from '../../repositories/order.repository.types';

/** Seller mappers remain under `api/` until controller cutover (Phase 9+). */
export function mapSellerOrderResponse(
  order: SellerOrderWithRelations,
  shop: TAuthorizedShop,
  lang: string,
) {
  return mapSellerOrder(order, lang, buildMapSellerOrderContext(shop, lang));
}

export function rethrowOrderDomainError(error: unknown): never {
  if (error instanceof OrderDomainError) {
    throw new BadRequestException(error.message);
  }
  throw error;
}

export function requireSellerOrderDetail(
  order: SellerOrderWithRelations | null | undefined,
  message: string,
): SellerOrderWithRelations {
  if (!order) {
    throw new NotFoundException(message);
  }
  return order;
}
