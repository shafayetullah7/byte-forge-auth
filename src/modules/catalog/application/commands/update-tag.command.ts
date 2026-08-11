import { BadRequestException, Injectable } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import type { UpdateTagDto } from '../../controllers/dto/update-tag.dto';
import { TagGroupRepository } from '../../repositories/tag-group.repository';
import { TagRepository } from '../../repositories/tag.repository';
import { GetAdminTagByIdQuery } from '../queries/get-admin-tag-by-id.query';

@Injectable()
export class UpdateTagCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly tagRepository: TagRepository,
    private readonly tagGroupRepository: TagGroupRepository,
    private readonly getAdminTagByIdQuery: GetAdminTagByIdQuery,
  ) {}

  async execute(id: string, updateTagDto: UpdateTagDto) {
    const tag = await this.getAdminTagByIdQuery.execute(id);

    if (updateTagDto.slug && updateTagDto.slug !== tag.slug) {
      const existingTag = await this.tagRepository.findBySlugs([
        updateTagDto.slug,
      ]);
      if (existingTag.length > 0) {
        throw new BadRequestException(
          `Tag with slug '${updateTagDto.slug}' already exists.`,
        );
      }
    }

    const isChangingGroup =
      updateTagDto.groupId && updateTagDto.groupId !== tag.groupId;
    if (isChangingGroup) {
      const group = await this.tagGroupRepository.findOne(
        updateTagDto.groupId!,
      );
      if (!group) {
        throw new BadRequestException(
          `Target Tag Group ${updateTagDto.groupId} does not exist or has been deleted.`,
        );
      }
    }

    try {
      if (isChangingGroup) {
        return await this.db.transaction(async (tx) => {
          await this.tagGroupRepository.decrementTagCount(tag.groupId, 1, tx);
          await this.tagGroupRepository.incrementTagCount(
            updateTagDto.groupId!,
            1,
            tx,
          );

          return await this.tagRepository.update(
            tag.id,
            {
              ...updateTagDto,
              updatedAt: new Date(),
            },
            tx,
          );
        });
      }

      return await this.tagRepository.update(tag.id, {
        ...updateTagDto,
        updatedAt: new Date(),
      });
    } catch (error: unknown) {
      if ((error as { code?: string }).code === '23505') {
        throw new BadRequestException(
          `Tag with slug '${updateTagDto.slug}' already exists.`,
        );
      }
      throw error;
    }
  }
}
