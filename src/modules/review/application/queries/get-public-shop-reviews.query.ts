import { Injectable, NotFoundException } from '@nestjs/common';
import { ShopStatusEnum } from '@/_db/drizzle/enum';
import { ShopQueryService } from '@/modules/shop/application/queries/shop.query';
import { resolveTranslation } from '@/libs/utils/resolve-translation.util';
import { mapReviewImages } from '@/libs/utils/map-review-images.util';
import { ReviewQueryService } from './review.query';
import type { ListPublicShopReviewsQueryDto } from '../../controllers/dto/list-public-shop-reviews-query.dto';

@Injectable()
export class GetPublicShopReviewsQuery {
  constructor(
    private readonly reviewQueryService: ReviewQueryService,
    private readonly shopQueryService: ShopQueryService,
  ) {}

  private async assertPublicShop(slug: string) {
    const shop = await this.shopQueryService.getShopBySlug(slug);

    if (!shop || shop.status !== ShopStatusEnum.ACTIVE) {
      throw new NotFoundException('Shop not found');
    }

    return shop;
  }

  async execute(
    slug: string,
    query: ListPublicShopReviewsQueryDto,
    lang: string,
  ) {
    const shop = await this.assertPublicShop(slug);

    const [summary, reviews] = await Promise.all([
      this.reviewQueryService.getShopReviewSummary(shop.id),
      this.reviewQueryService.listPublicShopReviews(shop.id, query),
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
