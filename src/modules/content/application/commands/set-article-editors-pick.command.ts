import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ShopContentModerationStatusEnum } from '@/_db/drizzle/enum';
import { ArticleRepository } from '../../repositories/article.repository';
import { GetAdminArticleQuery } from '../queries/get-admin-article.query';

@Injectable()
export class SetArticleEditorsPickCommand {
  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly getAdminArticleQuery: GetAdminArticleQuery,
  ) {}

  async execute(articleId: string, adminId: string, isEditorsPick: boolean) {
    const article = await this.articleRepository.findByIdForAdmin(articleId);
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    if (
      isEditorsPick &&
      article.moderationStatus !== ShopContentModerationStatusEnum.APPROVED
    ) {
      throw new BadRequestException(
        "Only approved articles can be marked as editor's pick",
      );
    }

    const updated = await this.articleRepository.setEditorsPick(
      articleId,
      isEditorsPick,
      isEditorsPick ? adminId : null,
    );

    if (!updated) {
      throw new NotFoundException('Article not found');
    }

    return this.getAdminArticleQuery.execute(articleId);
  }
}
