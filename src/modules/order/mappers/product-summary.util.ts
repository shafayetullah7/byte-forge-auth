import type { CatalogProductSummary } from '@/modules/catalog/application/queries';
import type { ProductSummaryMap } from '../application/utils/load-product-summaries';

export function productDisplayName(
  item: { productId: string; productName: string },
  summaries?: ProductSummaryMap,
): string {
  return summaries?.get(item.productId)?.name ?? item.productName;
}

export function productImageUrl(
  item: { productId: string },
  summaries?: ProductSummaryMap,
): string | null {
  return summaries?.get(item.productId)?.thumbnailUrl ?? null;
}

export function productThumbnail(
  item: { productId: string },
  summaries?: ProductSummaryMap,
): { id: string; url: string } | null {
  const summary = summaries?.get(item.productId);
  if (!summary?.thumbnailUrl) {
    return null;
  }

  return {
    id: summary.thumbnailId ?? summary.id,
    url: summary.thumbnailUrl,
  };
}

export type { CatalogProductSummary };
export type { ProductSummaryMap } from '../application/utils/load-product-summaries';
