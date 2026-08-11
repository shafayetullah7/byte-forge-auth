import { Injectable, NotFoundException } from '@nestjs/common';
import { resolveTranslation } from '@/common/utils/resolve-translation.util';
import { isUuid } from '@/common/utils/is-uuid.util';
import { TagGroupAdminRepository } from '../../repositories/tag-group-admin.repository';

@Injectable()
export class GetAdminTagGroupByIdQuery {
  constructor(
    private readonly tagGroupAdminRepository: TagGroupAdminRepository,
  ) {}

  async execute(id: string, lang: string) {
    const group = await this.tagGroupAdminRepository.findByIdOrSlug(id);
    if (!group) {
      throw new NotFoundException(
        `Tag Group with ${isUuid(id) ? 'ID' : 'slug'} '${id}' not found`,
      );
    }

    const translation = resolveTranslation(group.translations, lang);
    return {
      ...group,
      name: translation?.name ?? 'Unnamed Group',
    };
  }
}
