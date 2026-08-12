import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { CatalogQueryService } from '@/modules/catalog/application/queries';
import type { TAuthorizedShop } from '@/libs/types';
import { loadProductSummaries } from '../utils/load-product-summaries';
import {
  buildMapSellerOrderContext,
  mapSellerOrder,
} from '../../mappers/seller-orders.mapper';
import { OrderDomainError } from '../../domain/order.errors';
import type { SellerOrderWithRelations } from '../../repositories/order.repository.types';

/** Seller mappers live under `modules/order/mappers/`. */
export async function mapSellerOrderResponse(
  order: SellerOrderWithRelations,
  shop: TAuthorizedShop,
  lang: string,
  catalogQueryService: CatalogQueryService,
) {
  const productSummaries = await loadProductSummaries(
    catalogQueryService,
    order.items.map((item) => item.productId),
    lang,
  );

  return mapSellerOrder(
    order,
    lang,
    buildMapSellerOrderContext(shop, lang),
    productSummaries,
  );
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
