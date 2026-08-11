import { BadRequestException, Injectable } from '@nestjs/common';
import type { UpdateTagGroupDto } from '../../controllers/dto/update-tag-group.dto';
import { TagGroupRepository } from '../../repositories/tag-group.repository';
import { GetAdminTagGroupByIdQuery } from '../queries/get-admin-tag-group-by-id.query';

@Injectable()
export class UpdateTagGroupCommand {
  constructor(
    private readonly tagGroupRepository: TagGroupRepository,
    private readonly getAdminTagGroupByIdQuery: GetAdminTagGroupByIdQuery,
  ) {}

  async execute(
    id: string,
    updateTagGroupDto: UpdateTagGroupDto,
    lang: string,
  ) {
    const group = await this.getAdminTagGroupByIdQuery.execute(id, lang);

    if (updateTagGroupDto.slug && updateTagGroupDto.slug !== group.slug) {
      const existingGroup = await this.tagGroupRepository.findBySlug(
        updateTagGroupDto.slug,
      );
      if (existingGroup) {
        throw new BadRequestException(
          `Tag Group with slug '${updateTagGroupDto.slug}' already exists.`,
        );
      }
    }

    return await this.tagGroupRepository.update(group.id, {
      ...updateTagGroupDto,
      updatedAt: new Date(),
    });
  }
}
