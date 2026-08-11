import { Injectable } from '@nestjs/common';
import { paginate } from '@/common/utils/pagination.util';
import { resolveTranslation } from '@/common/utils/resolve-translation.util';
import type { TagGroupQueryDto } from '../../controllers/dto/tag-group-query.dto';
import { TagGroupAdminRepository } from '../../repositories/tag-group-admin.repository';

@Injectable()
export class ListAdminTagGroupsQuery {
  constructor(
    private readonly tagGroupAdminRepository: TagGroupAdminRepository,
  ) {}

  async execute(query: TagGroupQueryDto, lang: string) {
    const { groups, total, page, limit } =
      await this.tagGroupAdminRepository.listPaginated(query);

    const formattedGroups = groups.map((group) => {
      const { translations, tags, ...rest } = group;
      const englishTranslation = translations.find((t) => t.locale === 'en');
      const translation = resolveTranslation(translations, lang);

      const formattedTags = (tags || []).map((tag) => {
        const { translations: tagTranslations, ...tagRest } = tag;
        const tagTranslation = resolveTranslation(tagTranslations, lang);
        return {
          ...tagRest,
          translations: tagTranslations,
          name:
            tagTranslation?.name ||
            tagTranslations.find((t) => t.locale === 'en')?.name ||
            null,
        };
      });

      return {
        ...rest,
        translations,
        name: translation?.name || englishTranslation?.name || null,
        tags: formattedTags,
      };
    });

    return paginate(formattedGroups, total, page, limit);
  }
}
