import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ShopContentModerationStatusEnum } from '@/_db/drizzle/enum';
import { RejectArticleDto } from '../../controllers/dto/reject-article.dto';
import { ArticleRepository } from '../../repositories/article.repository';
import { GetAdminArticleQuery } from '../queries/get-admin-article.query';

@Injectable()
export class RejectArticleCommand {
  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly getAdminArticleQuery: GetAdminArticleQuery,
  ) {}

  async execute(articleId: string, adminId: string, dto: RejectArticleDto) {
    const article = await this.articleRepository.findByIdForAdmin(articleId);
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    if (article.moderationStatus !== ShopContentModerationStatusEnum.PENDING) {
      throw new BadRequestException('Only pending articles can be rejected');
    }

    const updated = await this.articleRepository.updateModerationStatus(
      articleId,
      ShopContentModerationStatusEnum.REJECTED,
      {
        rejectedReason: dto.reason,
        moderatedByAdminId: adminId,
        moderatedAt: new Date(),
      },
    );

    if (!updated) {
      throw new NotFoundException('Article not found');
    }

    return this.getAdminArticleQuery.execute(articleId);
  }
}
