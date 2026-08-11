import { Injectable } from '@nestjs/common';
import { ProductRepository } from '../../repositories/product.repository';

export type CatalogProductSummary = {
  id: string;
  slug: string;
  name: string;
  thumbnailUrl: string | null;
};

/**
 * Cross-module read facade for order, shop, and other callers.
 */
@Injectable()
export class CatalogQueryService {
  constructor(private readonly productRepository: ProductRepository) {}

  getProductSummaries(ids: string[]): Promise<CatalogProductSummary[]> {
    return this.productRepository.findSummariesByIds(ids);
  }
}
