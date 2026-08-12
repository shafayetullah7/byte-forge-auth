import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateArticleDto } from '../../controllers/dto/update-article.dto';
import { assertEditableArticleStatus } from '../../domain/article-policy';
import { mapSellerArticle } from '../../mappers/seller-articles.mapper';
import {
  ArticleRepository,
  type ArticleTranslationInput,
} from '../../repositories/article.repository';

@Injectable()
export class UpdateArticleCommand {
  constructor(private readonly articleRepository: ArticleRepository) {}

  async execute(shopId: string, articleId: string, dto: UpdateArticleDto) {
    const existing = await this.articleRepository.findByIdForShop(
      shopId,
      articleId,
    );
    if (!existing) throw new NotFoundException('Article not found');
    if (!assertEditableArticleStatus(existing.moderationStatus)) {
      throw new BadRequestException(
        'Article cannot be edited in current status',
      );
    }

    if (dto.slug && dto.slug !== existing.slug) {
      const taken = await this.articleRepository.slugExists(
        shopId,
        dto.slug,
        articleId,
      );
      if (taken) throw new ConflictException('Slug already exists');
    }

    const article = await this.articleRepository.updateArticle(
      shopId,
      articleId,
      {
        slug: dto.slug,
        coverImageId: dto.coverImageId,
        category: dto.category,
        readMinutes: dto.readMinutes,
      },
      dto.translations as ArticleTranslationInput | undefined,
    );

    if (!article) throw new NotFoundException('Article not found');
    return mapSellerArticle(article);
  }
}
