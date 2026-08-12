import { Injectable } from '@nestjs/common';
import { paginate } from '@/libs/utils/pagination.util';
import type { TagQueryDto } from '../../controllers/dto/tag-query.dto';
import { TagAdminRepository } from '../../repositories/tag-admin.repository';

@Injectable()
export class ListAdminTagsQuery {
  constructor(private readonly tagAdminRepository: TagAdminRepository) {}

  async execute(query: TagQueryDto) {
    const { data, total, page, limit } =
      await this.tagAdminRepository.listPaginated(query);

    const formattedData = data.map((tag) => {
      const { translations, ...rest } = tag;
      const englishTranslation = translations.find((t) => t.locale === 'en');
      return {
        ...rest,
        translations,
        name: englishTranslation?.name || null,
      };
    });

    return paginate(formattedData, total, page, limit);
  }
}
