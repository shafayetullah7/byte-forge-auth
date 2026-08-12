import { Injectable } from '@nestjs/common';
import { paginate } from '@/libs/utils/pagination.util';
import { resolveTranslation } from '@/libs/utils/resolve-translation.util';
import type { CategoryQueryDto } from '../../controllers/dto/category-query.dto';
import { CategoryAdminRepository } from '../../repositories/category-admin.repository';

@Injectable()
export class ListAdminCategoriesQuery {
  constructor(
    private readonly categoryAdminRepository: CategoryAdminRepository,
  ) {}

  async execute(query: CategoryQueryDto, lang: string) {
    const { data, total, page, limit } =
      await this.categoryAdminRepository.listPaginated(query);

    const enriched = data.map((cat) => {
      const { translations, parentHierarchies, ...rest } = cat;
      const translation = resolveTranslation(translations, lang);
      const parentId = parentHierarchies[0]?.ancestorId ?? null;

      return {
        ...rest,
        name: translation?.name ?? 'Unnamed Category',
        description: translation?.description,
        parentId,
        translations,
      };
    });

    return paginate(enriched, total, page, limit);
  }
}
