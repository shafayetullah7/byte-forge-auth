import { Injectable, NotFoundException } from '@nestjs/common';
import { ShopStatusEnum } from '@/_db/drizzle/enum';
import { ShopQueryService } from '@/modules/shop/application/queries/shop.query';
import { mapPublicShopArticle } from '../../mappers/public-shop-article.mapper';
import { ArticleRepository } from '../../repositories/article.repository';

@Injectable()
export class ListPublicShopArticlesQuery {
  constructor(
    private readonly shopQueryService: ShopQueryService,
    private readonly articleRepository: ArticleRepository,
  ) {}

  async execute(slug: string, lang: string) {
    const shop = await this.requireActiveShop(slug);
    const articles = await this.articleRepository.listApprovedByShopId(shop.id);
    return articles.map((a) => mapPublicShopArticle(a, lang));
  }

  private async requireActiveShop(slug: string) {
    const shop = await this.shopQueryService.getShopBySlug(slug);
    if (!shop || shop.status !== ShopStatusEnum.ACTIVE) {
      throw new NotFoundException('Shop not found');
    }
    return shop;
  }
}
