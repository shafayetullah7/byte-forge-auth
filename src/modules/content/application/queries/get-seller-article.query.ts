import { Injectable, NotFoundException } from '@nestjs/common';
import { mapSellerArticle } from '../../mappers/seller-articles.mapper';
import { ArticleRepository } from '../../repositories/article.repository';

@Injectable()
export class GetSellerArticleQuery {
  constructor(private readonly articleRepository: ArticleRepository) {}

  async execute(shopId: string, articleId: string) {
    const article = await this.articleRepository.findByIdForShop(
      shopId,
      articleId,
    );
    if (!article) throw new NotFoundException('Article not found');
    return mapSellerArticle(article);
  }
}
