import { Injectable } from '@nestjs/common';
import { resolveTranslation } from '@/common/utils/resolve-translation.util';
import { TagGroupAdminRepository } from '../../repositories/tag-group-admin.repository';

export type PublicTagResponse = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  usageCount: number;
};

export type PublicTagGroupResponse = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  tags: PublicTagResponse[];
};

@Injectable()
export class ListPublicTagsQuery {
  constructor(
    private readonly tagGroupAdminRepository: TagGroupAdminRepository,
  ) {}

  async execute(lang: string = 'en'): Promise<PublicTagGroupResponse[]> {
    const activeGroups =
      await this.tagGroupAdminRepository.listActiveWithTags();

    return activeGroups
      .filter((group) => group.tags.length > 0)
      .map((group) => {
        const groupTranslation = resolveTranslation(group.translations, lang);

        return {
          id: group.id,
          slug: group.slug,
          name: groupTranslation?.name ?? 'Unnamed Group',
          description: groupTranslation?.description ?? null,
          tags: group.tags.map((tag) => {
            const tagTranslation = resolveTranslation(tag.translations, lang);

            return {
              id: tag.id,
              slug: tag.slug,
              name: tagTranslation?.name ?? 'Unnamed Tag',
              description: tagTranslation?.description ?? null,
              usageCount: tag.usageCount,
            };
          }),
        };
      });
  }
}
