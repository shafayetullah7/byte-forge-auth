import { Injectable } from '@nestjs/common';
import { ListArticlesQueryDto } from '../../controllers/dto/list-articles-query.dto';
import { mapSellerArticleListItem } from '../../mappers/seller-articles.mapper';
import { ArticleRepository } from '../../repositories/article.repository';

@Injectable()
export class ListSellerArticlesQuery {
  constructor(private readonly articleRepository: ArticleRepository) {}

  async execute(shopId: string, query: ListArticlesQueryDto) {
    const result = await this.articleRepository.listByShopId(shopId, query);
    return {
      data: result.data.map(mapSellerArticleListItem),
      meta: result.meta,
    };
  }
}
