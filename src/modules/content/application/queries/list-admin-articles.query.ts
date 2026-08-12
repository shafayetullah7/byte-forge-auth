import { Injectable } from '@nestjs/common';
import { AdminArticlesQueryDto } from '../../controllers/dto/admin-articles-query.dto';
import {
  mapAdminArticleListItem,
  type ArticleAdminRow,
} from '../../mappers/admin-articles.mapper';
import { ArticleRepository } from '../../repositories/article.repository';

@Injectable()
export class ListAdminArticlesQuery {
  constructor(private readonly articleRepository: ArticleRepository) {}

  async execute(query: AdminArticlesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const result = await this.articleRepository.listAdmin({
      page,
      limit,
      search: query.search,
      moderationStatus: query.moderationStatus,
    });

    return {
      data: result.data.map((article) =>
        mapAdminArticleListItem(article as ArticleAdminRow),
      ),
      meta: result.meta,
    };
  }
}
