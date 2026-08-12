import { Injectable, NotFoundException } from '@nestjs/common';
import { resolveTranslation } from '@/libs/utils/resolve-translation.util';
import { TagAdminRepository } from '../../repositories/tag-admin.repository';
import type { PublicTagResponse } from './list-public-tags.query';

@Injectable()
export class GetPublicTagByIdQuery {
  constructor(private readonly tagAdminRepository: TagAdminRepository) {}

  async execute(id: string, lang: string = 'en'): Promise<PublicTagResponse> {
    const tag = await this.tagAdminRepository.findPublicById(id);

    if (!tag) {
      throw new NotFoundException(`Tag ${id} not found.`);
    }

    const translation = resolveTranslation(tag.translations, lang);

    return {
      id: tag.id,
      slug: tag.slug,
      name: translation?.name ?? 'Unnamed Tag',
      description: translation?.description ?? null,
      usageCount: tag.usageCount,
    };
  }
}
