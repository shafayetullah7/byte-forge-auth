import { Injectable, NotFoundException } from '@nestjs/common';
import { ShopArticleRepository } from '@/_repositories/business/shop-article.repository/shop-article.repository';
import { ShopStatusEnum } from '@/_db/drizzle/enum';
import { mapPublicShopArticle } from '../../mappers/public-shop-article.mapper';
import { ShopRepository } from '../../repositories/shop.repository';

@Injectable()
export class ListPublicShopArticlesQuery {
  constructor(
    private readonly shopRepository: ShopRepository,
    private readonly articleRepository: ShopArticleRepository,
  ) {}

  async execute(slug: string, lang: string) {
    const shop = await this.requireActiveShop(slug);
    const articles = await this.articleRepository.listApprovedByShopId(shop.id);
    return articles.map((a) => mapPublicShopArticle(a, lang));
  }

  async getDetail(slug: string, articleSlug: string, lang: string) {
    const shop = await this.requireActiveShop(slug);
    const article = await this.articleRepository.findApprovedByShopSlug(
      shop.id,
      articleSlug,
    );
    if (!article) throw new NotFoundException('Article not found');
    return mapPublicShopArticle(article, lang);
  }

  private async requireActiveShop(slug: string) {
    const shop = await this.shopRepository.getShopBySlug(slug);
    if (!shop || shop.status !== ShopStatusEnum.ACTIVE) {
      throw new NotFoundException('Shop not found');
    }
    return shop;
  }
}
