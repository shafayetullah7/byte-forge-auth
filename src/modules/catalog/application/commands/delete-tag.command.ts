import { BadRequestException, Injectable } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { TagGroupRepository } from '../../repositories/tag-group.repository';
import { TagRepository } from '../../repositories/tag.repository';
import { GetAdminTagByIdQuery } from '../queries/get-admin-tag-by-id.query';

@Injectable()
export class DeleteTagCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly tagRepository: TagRepository,
    private readonly tagGroupRepository: TagGroupRepository,
    private readonly getAdminTagByIdQuery: GetAdminTagByIdQuery,
  ) {}

  async execute(id: string) {
    const tag = await this.getAdminTagByIdQuery.execute(id);

    if (tag.usageCount > 0) {
      throw new BadRequestException(
        'Cannot delete tag. It is currently being used by products.',
      );
    }

    await this.db.transaction(async (tx) => {
      await this.tagRepository.softDelete(tag.id, tx);
      await this.tagGroupRepository.decrementTagCount(tag.groupId, 1, tx);
    });
  }
}
