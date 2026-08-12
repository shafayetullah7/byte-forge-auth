import { Injectable, NotFoundException } from '@nestjs/common';
import { ShopContentModerationStatusEnum } from '@/_db/drizzle/enum';
import { mapSellerArticle } from '../../mappers/seller-articles.mapper';
import { ArticleRepository } from '../../repositories/article.repository';

@Injectable()
export class ArchiveArticleCommand {
  constructor(private readonly articleRepository: ArticleRepository) {}

  async execute(shopId: string, articleId: string) {
    const existing = await this.articleRepository.findByIdForShop(
      shopId,
      articleId,
    );
    if (!existing) throw new NotFoundException('Article not found');

    await this.articleRepository.updateModerationStatus(
      articleId,
      ShopContentModerationStatusEnum.ARCHIVED,
    );

    const article = await this.articleRepository.findByIdForShop(
      shopId,
      articleId,
    );
    return mapSellerArticle(article!);
  }
}
