import { Injectable, NotFoundException } from '@nestjs/common';
import { TagGroupAdminRepository } from '../../repositories/tag-group-admin.repository';
import { TagGroupRepository } from '../../repositories/tag-group.repository';

@Injectable()
export class ListTagGroupTranslationsQuery {
  constructor(
    private readonly tagGroupRepository: TagGroupRepository,
    private readonly tagGroupAdminRepository: TagGroupAdminRepository,
  ) {}

  async execute(groupId: string) {
    const group = await this.tagGroupRepository.findOne(groupId);
    if (!group) {
      throw new NotFoundException(`Tag Group with ID ${groupId} not found`);
    }

    return this.tagGroupAdminRepository.listTranslations(groupId);
  }
}
