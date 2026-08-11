import type {
  CatalogProductSummary,
  CatalogQueryService,
} from '@/modules/catalog/application/queries';

export type ProductSummaryMap = Map<string, CatalogProductSummary>;

export async function loadProductSummaries(
  catalogQuery: CatalogQueryService,
  productIds: string[],
  lang: string,
): Promise<ProductSummaryMap> {
  const uniqueIds = [...new Set(productIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return new Map();
  }

  const summaries = await catalogQuery.getProductSummaries(uniqueIds, lang);
  return new Map(summaries.map((summary) => [summary.id, summary]));
}

export function collectProductIdsFromOrders(
  orders: Array<{ items: Array<{ productId: string }> }>,
): string[] {
  return orders.flatMap((order) => order.items.map((item) => item.productId));
}
