import { Injectable, NotFoundException } from '@nestjs/common';
import { GetPublicProductReviewsQuery } from './get-public-product-reviews.query';
import { ReviewRepository } from '../../repositories/review.repository';
import type { ReviewListParams } from '../../repositories/review.repository.types';

@Injectable()
export class GetPublicPlantReviewsQuery {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly getPublicProductReviewsQuery: GetPublicProductReviewsQuery,
  ) {}

  async execute(slug: string, query: ReviewListParams) {
    const productId = await this.reviewRepository.getProductIdBySlug(slug);
    if (!productId) {
      throw new NotFoundException('Plant not found');
    }

    return this.getPublicProductReviewsQuery.execute(productId, query);
  }
}
