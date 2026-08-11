import { Injectable, NotFoundException } from '@nestjs/common';
import { ReviewRepository } from '@/_repositories/review/review.repository/review.repository';
import { ShopRepository } from '@/modules/shop/repositories';
import { ShopStatusEnum } from '@/_db/drizzle/enum';
import { resolveTranslation } from '@/common/utils/resolve-translation.util';
import { mapReviewImages } from '@/common/utils/map-review-images.util';
import { ListPublicShopReviewsQueryDto } from '../dto/list-public-shop-reviews-query.dto';

@Injectable()
export class PublicShopReviewsService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly shopRepository: ShopRepository,
  ) {}

  private async assertPublicShop(slug: string) {
    const shop = await this.shopRepository.getShopBySlug(slug);

    if (!shop || shop.status !== ShopStatusEnum.ACTIVE) {
      throw new NotFoundException('Shop not found');
    }

    return shop;
  }

  async getShopReviews(
    slug: string,
    query: ListPublicShopReviewsQueryDto,
    lang: string,
  ) {
    const shop = await this.assertPublicShop(slug);

    const [summary, reviews] = await Promise.all([
      this.reviewRepository.getShopReviewSummary(shop.id),
      this.reviewRepository.listPublicShopReviews(shop.id, query),
    ]);

    return {
      summary: {
        average: summary.average,
        total: summary.total,
        distribution: summary.distribution,
      },
      reviews: reviews.data.map((review) => {
        const customerName = review.user
          ? `${review.user.firstName} ${review.user.lastName}`.trim()
          : 'Verified buyer';
        const productTranslation = review.product?.translations
          ? resolveTranslation(review.product.translations, lang)
          : null;

        return {
          id: review.id,
          customerName: customerName || 'Verified buyer',
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          createdAt: review.createdAt.toISOString(),
          isVerifiedPurchase: review.isVerifiedPurchase,
          productName:
            productTranslation?.name ?? review.product?.slug ?? 'Product',
          images: mapReviewImages(review.images),
        };
      }),
      meta: reviews.meta,
    };
  }
}
