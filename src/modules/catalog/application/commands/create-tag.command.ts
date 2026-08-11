import { BadRequestException, Injectable } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import type { CreateTagDto } from '../../controllers/dto/create-tag.dto';
import { TagGroupRepository } from '../../repositories/tag-group.repository';
import { TagRepository } from '../../repositories/tag.repository';

@Injectable()
export class CreateTagCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly tagRepository: TagRepository,
    private readonly tagGroupRepository: TagGroupRepository,
  ) {}

  async execute(createTagDto: CreateTagDto) {
    const group = await this.tagGroupRepository.findOne(createTagDto.groupId);
    if (!group) {
      throw new BadRequestException(
        `Tag Group ${createTagDto.groupId} does not exist.`,
      );
    }

    const existingTags = await this.tagRepository.findBySlugs([
      createTagDto.slug,
    ]);
    if (existingTags.length > 0) {
      throw new BadRequestException(
        `Tag with slug '${createTagDto.slug}' already exists.`,
      );
    }

    try {
      return await this.db.transaction(async (tx) => {
        const tag = await this.tagRepository.create(
          {
            slug: createTagDto.slug,
            groupId: createTagDto.groupId,
            isActive: createTagDto.isActive,
          },
          tx,
        );

        await this.tagRepository.createTranslations(
          tag.id,
          createTagDto.translations,
          tx,
        );

        await this.tagGroupRepository.incrementTagCount(tag.groupId, 1, tx);

        return tag;
      });
    } catch (error: unknown) {
      if ((error as { code?: string }).code === '23505') {
        throw new BadRequestException(
          `Tag with slug '${createTagDto.slug}' already exists.`,
        );
      }
      throw error;
    }
  }
}
