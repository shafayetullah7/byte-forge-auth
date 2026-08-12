import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ShopContentModerationStatusEnum } from '@/_db/drizzle/enum';
import { assertEditableArticleStatus } from '../../domain/article-policy';
import { mapSellerArticle } from '../../mappers/seller-articles.mapper';
import { ArticleRepository } from '../../repositories/article.repository';

@Injectable()
export class SubmitArticleCommand {
  constructor(private readonly articleRepository: ArticleRepository) {}

  async execute(shopId: string, articleId: string, shopStatus: string) {
    if (shopStatus !== 'ACTIVE') {
      throw new BadRequestException('Shop must be active to submit articles');
    }

    const existing = await this.articleRepository.findByIdForShop(
      shopId,
      articleId,
    );
    if (!existing) throw new NotFoundException('Article not found');

    if (!assertEditableArticleStatus(existing.moderationStatus)) {
      throw new BadRequestException('Article cannot be submitted');
    }

    const en = existing.translations.find((t) => t.locale === 'en');
    const bn = existing.translations.find((t) => t.locale === 'bn');
    if (
      !en?.title?.trim() ||
      !en?.excerpt?.trim() ||
      !en?.body?.trim() ||
      !bn?.title?.trim() ||
      !bn?.excerpt?.trim() ||
      !bn?.body?.trim()
    ) {
      throw new BadRequestException(
        'English and Bengali title, excerpt, and body are required to submit',
      );
    }

    const updated = await this.articleRepository.updateModerationStatus(
      articleId,
      ShopContentModerationStatusEnum.PENDING,
      { rejectedReason: null },
    );

    const article = await this.articleRepository.findByIdForShop(
      shopId,
      updated.id,
    );
    return mapSellerArticle(article!);
  }
}
