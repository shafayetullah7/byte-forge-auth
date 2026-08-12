import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { assertDeletableArticleStatus } from '../../domain/article-policy';
import { ArticleRepository } from '../../repositories/article.repository';

@Injectable()
export class DeleteArticleCommand {
  constructor(private readonly articleRepository: ArticleRepository) {}

  async execute(shopId: string, articleId: string) {
    const existing = await this.articleRepository.findByIdForShop(
      shopId,
      articleId,
    );
    if (!existing) throw new NotFoundException('Article not found');
    if (!assertDeletableArticleStatus(existing.moderationStatus)) {
      throw new BadRequestException('Approved articles cannot be deleted');
    }

    await this.articleRepository.deleteArticle(shopId, articleId);
    return { id: articleId };
  }
}
