import { Injectable } from '@nestjs/common';

export type CatalogProductSummary = {
  id: string;
  slug: string;
  name: string;
  thumbnailUrl: string | null;
};

/**
 * Cross-module read facade for order, shop, and other callers.
 * Product/plant methods fill in as catalog migrates (Phases 33–37).
 */
@Injectable()
export class CatalogQueryService {
  /**
   * Batch product summaries by ID. Stub until product repos move into catalog.
   */
  getProductSummaries(ids: string[]): Promise<CatalogProductSummary[]> {
    void ids;
    return Promise.resolve([]);
  }
}
