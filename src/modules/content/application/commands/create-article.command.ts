import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ShopContentModerationStatusEnum } from '@/_db/drizzle/enum';
import { CreateArticleDto } from '../../controllers/dto/create-article.dto';
import { mapSellerArticle } from '../../mappers/seller-articles.mapper';
import { ArticleRepository } from '../../repositories/article.repository';

@Injectable()
export class CreateArticleCommand {
  constructor(private readonly articleRepository: ArticleRepository) {}

  async execute(shopId: string, dto: CreateArticleDto) {
    const slug =
      dto.slug ??
      (await this.articleRepository.generateUniqueSlug(
        shopId,
        dto.translations.en.title,
      ));

    if (dto.slug) {
      const taken = await this.articleRepository.slugExists(shopId, dto.slug);
      if (taken) throw new ConflictException('Slug already exists');
    }

    const translations = {
      en: dto.translations.en,
      bn: dto.translations.bn ?? {
        title: dto.translations.en.title,
        excerpt: dto.translations.en.excerpt ?? null,
        body: dto.translations.en.body ?? null,
      },
    };

    const article = await this.articleRepository.createArticle(
      {
        shopId,
        slug,
        coverImageId: dto.coverImageId ?? null,
        category: dto.category ?? null,
        readMinutes: dto.readMinutes ?? null,
        moderationStatus: ShopContentModerationStatusEnum.DRAFT,
      },
      translations,
    );

    if (!article) throw new NotFoundException('Article not found');
    return mapSellerArticle(article);
  }
}
