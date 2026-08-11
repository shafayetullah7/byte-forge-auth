import { BadRequestException, Injectable } from '@nestjs/common';
import { TagGroupAdminRepository } from '../../repositories/tag-group-admin.repository';
import { TagGroupRepository } from '../../repositories/tag-group.repository';
import { GetAdminTagGroupByIdQuery } from '../queries/get-admin-tag-group-by-id.query';

@Injectable()
export class DeleteTagGroupCommand {
  constructor(
    private readonly tagGroupRepository: TagGroupRepository,
    private readonly tagGroupAdminRepository: TagGroupAdminRepository,
    private readonly getAdminTagGroupByIdQuery: GetAdminTagGroupByIdQuery,
  ) {}

  async execute(id: string, lang: string) {
    const group = await this.getAdminTagGroupByIdQuery.execute(id, lang);

    const hasTags = await this.tagGroupAdminRepository.hasActiveTags(group.id);
    if (hasTags) {
      throw new BadRequestException(
        'Cannot delete Tag Group. It currently contains active tags.',
      );
    }

    await this.tagGroupRepository.softDelete(group.id);
  }
}
