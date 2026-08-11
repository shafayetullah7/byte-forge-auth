import { BadRequestException, Injectable } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import type { TNewTagTranslation } from '@/_db/drizzle/schema/taxonomy';
import type { CreateTagGroupDto } from '../../controllers/dto/create-tag-group.dto';
import { TagGroupRepository } from '../../repositories/tag-group.repository';
import { TagRepository } from '../../repositories/tag.repository';

@Injectable()
export class CreateTagGroupCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly tagGroupRepository: TagGroupRepository,
    private readonly tagRepository: TagRepository,
  ) {}

  async execute(createTagGroupDto: CreateTagGroupDto) {
    const existingGroup = await this.tagGroupRepository.findBySlug(
      createTagGroupDto.slug,
    );
    if (existingGroup) {
      throw new BadRequestException(
        `Tag Group with slug '${createTagGroupDto.slug}' already exists.`,
      );
    }

    if (createTagGroupDto.tags && createTagGroupDto.tags.length > 0) {
      const tagSlugs = createTagGroupDto.tags.map((t) => t.slug);
      const existingTags = await this.tagRepository.findBySlugs(tagSlugs);
      if (existingTags.length > 0) {
        const duplicateSlugs = existingTags.map((t) => t.slug).join(', ');
        throw new BadRequestException(
          `The following tag slugs already exist: ${duplicateSlugs}`,
        );
      }
    }

    try {
      return await this.db.transaction(async (tx) => {
        const group = await this.tagGroupRepository.create(
          {
            slug: createTagGroupDto.slug,
            isActive: createTagGroupDto.isActive,
          },
          tx,
        );

        await this.tagGroupRepository.createTranslations(
          group.id,
          createTagGroupDto.translations,
          tx,
        );

        if (createTagGroupDto.tags && createTagGroupDto.tags.length > 0) {
          const tagsData = createTagGroupDto.tags.map((tagDto) => ({
            groupId: group.id,
            slug: tagDto.slug,
            isActive: tagDto.isActive,
          }));
          const insertedTags = await this.tagRepository.createMany(
            tagsData,
            tx,
          );

          const tagTranslationsData: TNewTagTranslation[] = [];
          for (let i = 0; i < insertedTags.length; i++) {
            const insertedTag = insertedTags[i];
            const tagDto = createTagGroupDto.tags[i];

            for (const t of tagDto.translations) {
              tagTranslationsData.push({
                tagId: insertedTag.id,
                locale: t.locale,
                name: t.name,
                description: t.description,
              });
            }
          }

          if (tagTranslationsData.length > 0) {
            await this.tagRepository.createManyTranslations(
              tagTranslationsData,
              tx,
            );
          }

          await this.tagGroupRepository.incrementTagCount(
            group.id,
            insertedTags.length,
            tx,
          );
        }

        return group;
      });
    } catch (error: unknown) {
      if ((error as { code?: string }).code === '23505') {
        throw new BadRequestException(
          'A slug conflict occurred — the group or one of its tag slugs may already be in use.',
        );
      }
      throw error;
    }
  }
}
