import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ShopContentModerationStatusEnum } from '@/_db/drizzle/enum';
import { ArticleRepository } from '../../repositories/article.repository';
import { GetAdminArticleQuery } from '../queries/get-admin-article.query';

@Injectable()
export class ApproveArticleCommand {
  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly getAdminArticleQuery: GetAdminArticleQuery,
  ) {}

  async execute(articleId: string, adminId: string) {
    const article = await this.articleRepository.findByIdForAdmin(articleId);
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    if (article.moderationStatus !== ShopContentModerationStatusEnum.PENDING) {
      throw new BadRequestException('Only pending articles can be approved');
    }

    const updated = await this.articleRepository.updateModerationStatus(
      articleId,
      ShopContentModerationStatusEnum.APPROVED,
      {
        rejectedReason: null,
        moderatedByAdminId: adminId,
        moderatedAt: new Date(),
        publishedAt: article.publishedAt ?? new Date(),
      },
    );

    if (!updated) {
      throw new NotFoundException('Article not found');
    }

    return this.getAdminArticleQuery.execute(articleId);
  }
}
