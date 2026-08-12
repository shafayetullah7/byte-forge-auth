import { Injectable, NotFoundException } from '@nestjs/common';
import { mapAdminArticleDetail } from '../../mappers/admin-articles.mapper';
import { ArticleRepository } from '../../repositories/article.repository';

@Injectable()
export class GetAdminArticleQuery {
  constructor(private readonly articleRepository: ArticleRepository) {}

  async execute(articleId: string) {
    const article = await this.articleRepository.findByIdForAdmin(articleId);
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    return mapAdminArticleDetail(article);
  }
}
