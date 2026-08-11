import { Injectable, NotFoundException } from '@nestjs/common';
import { TagAdminRepository } from '../../repositories/tag-admin.repository';
import { TagRepository } from '../../repositories/tag.repository';

@Injectable()
export class ListTagTranslationsQuery {
  constructor(
    private readonly tagRepository: TagRepository,
    private readonly tagAdminRepository: TagAdminRepository,
  ) {}

  async execute(tagId: string) {
    const tag = await this.tagRepository.findOne(tagId);
    if (!tag) throw new NotFoundException(`Tag with ID ${tagId} not found`);

    return this.tagAdminRepository.listTranslations(tagId);
  }
}
