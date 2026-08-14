import { BadRequestException, Injectable } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import type { TNewTagTranslation } from '@/_db/drizzle/schema/taxonomy';
import type { BulkImportTagGroupsDto } from '../../controllers/dto/bulk-import-tag-groups.dto';
import { TagGroupRepository } from '../../repositories/tag-group.repository';
import { TagRepository } from '../../repositories/tag.repository';
import type {
  BulkImportTagGroupsResult,
  BulkImportTagGroupsRowResult,
  NormalizedGroupImport,
} from './bulk-import-tag-groups.types';
import { normalizeGroupImport } from './bulk-import-tag-groups.util';

@Injectable()
export class BulkImportTagGroupsCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly tagGroupRepository: TagGroupRepository,
    private readonly tagRepository: TagRepository,
  ) {}

  async execute(dto: BulkImportTagGroupsDto): Promise<BulkImportTagGroupsResult> {
    const options = {
      dryRun: dto.options?.dryRun ?? false,
      onDuplicate: dto.options?.onDuplicate ?? 'skip',
    };

    const groups = dto.groups.map(normalizeGroupImport);
    const results: BulkImportTagGroupsRowResult[] = [];

    this.assertUniqueGroupSlugsInBatch(groups);
    this.assertUniqueTagSlugsInBatch(groups);

    const allTagSlugs = groups.flatMap((group) => group.tags.map((tag) => tag.slug));
    const existingTags = await this.tagRepository.findBySlugs(allTagSlugs);
    const existingTagBySlug = new Map(
      existingTags.map((tag) => [tag.slug, tag]),
    );
    const existingTagSlugs = new Set(existingTags.map((tag) => tag.slug));

    const groupSlugSet = new Set(groups.map((group) => group.slug));
    const existingGroups = await Promise.all(
      [...groupSlugSet].map(async (slug) => ({
        slug,
        row: await this.tagGroupRepository.findBySlug(slug),
      })),
    );
    const existingGroupBySlug = new Map(
      existingGroups
        .filter((entry) => entry.row)
        .map((entry) => [entry.slug, entry.row!]),
    );

    for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
      const group = groups[groupIndex];
      const groupRef = `groups[${groupIndex}]`;
      const existingGroup = existingGroupBySlug.get(group.slug);

      if (group.existing && !existingGroup) {
        results.push({
          ref: groupRef,
          entity: 'tag_group',
          slug: group.slug,
          status: 'error',
          message: `Group '${group.slug}' is marked existing but was not found`,
        });
        continue;
      }

      if (!group.existing && !existingGroup && !group.translations) {
        results.push({
          ref: groupRef,
          entity: 'tag_group',
          slug: group.slug,
          status: 'error',
          message: 'Translations are required for new groups',
        });
        continue;
      }

      if (existingGroup) {
        if (options.onDuplicate === 'error') {
          results.push({
            ref: groupRef,
            entity: 'tag_group',
            slug: group.slug,
            status: 'error',
            message: `Tag group '${group.slug}' already exists`,
          });
        } else if (options.onDuplicate === 'upsert') {
          results.push({
            ref: groupRef,
            entity: 'tag_group',
            slug: group.slug,
            status: 'updated',
            id: existingGroup.id,
            message: options.dryRun ? 'Would update group' : undefined,
          });
        } else {
          results.push({
            ref: groupRef,
            entity: 'tag_group',
            slug: group.slug,
            status: 'skipped',
            id: existingGroup.id,
            message: 'Group already exists — tags will be added when eligible',
          });
        }
      }

      for (let tagIndex = 0; tagIndex < group.tags.length; tagIndex++) {
        const tag = group.tags[tagIndex];
        const tagRef = `${groupRef}.tags[${tagIndex}]`;

        if (existingTagSlugs.has(tag.slug)) {
          const existingTag = existingTagBySlug.get(tag.slug)!;
          if (options.onDuplicate === 'error') {
            results.push({
              ref: tagRef,
              entity: 'tag',
              slug: tag.slug,
              status: 'error',
              message: `Tag '${tag.slug}' already exists`,
            });
          } else if (options.onDuplicate === 'upsert') {
            const targetGroupId = existingGroup?.id;
            if (!targetGroupId || existingTag.groupId !== targetGroupId) {
              results.push({
                ref: tagRef,
                entity: 'tag',
                slug: tag.slug,
                status: 'error',
                message: `Tag '${tag.slug}' already exists in a different tag group`,
              });
            } else {
              results.push({
                ref: tagRef,
                entity: 'tag',
                slug: tag.slug,
                status: 'updated',
                id: existingTag.id,
                message: options.dryRun ? 'Would update tag' : undefined,
              });
            }
          } else {
            results.push({
              ref: tagRef,
              entity: 'tag',
              slug: tag.slug,
              status: 'skipped',
              message: 'Tag slug already exists',
            });
          }
        }
      }
    }

    const errorCount = results.filter((row) => row.status === 'error').length;
    if (errorCount > 0) {
      return this.buildResult(options.dryRun, false, results);
    }

    if (options.dryRun) {
      for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
        const group = groups[groupIndex];
        const groupRef = `groups[${groupIndex}]`;
        const existingGroup = existingGroupBySlug.get(group.slug);
        const alreadyLoggedGroup = results.some(
          (row) => row.ref === groupRef && row.entity === 'tag_group',
        );

        if (!alreadyLoggedGroup && !existingGroup) {
          results.push({
            ref: groupRef,
            entity: 'tag_group',
            slug: group.slug,
            status: 'created',
            message: 'Would create group',
          });
        }

        for (let tagIndex = 0; tagIndex < group.tags.length; tagIndex++) {
          const tag = group.tags[tagIndex];
          const tagRef = `${groupRef}.tags[${tagIndex}]`;
          if (results.some((row) => row.ref === tagRef)) continue;
          if (existingTagSlugs.has(tag.slug)) continue;

          results.push({
            ref: tagRef,
            entity: 'tag',
            slug: tag.slug,
            status: 'created',
            message: 'Would create tag',
          });
        }
      }

      return this.buildResult(true, true, results);
    }

    try {
      await this.db.transaction(async (tx) => {
        for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
          const group = groups[groupIndex];
          const groupRef = `groups[${groupIndex}]`;
          let groupId = existingGroupBySlug.get(group.slug)?.id;

          if (!groupId) {
            const createdGroup = await this.tagGroupRepository.create(
              {
                slug: group.slug,
                isActive: group.isActive ?? true,
              },
              tx,
            );
            groupId = createdGroup.id;

            await this.tagGroupRepository.createTranslations(
              groupId,
              group.translations!.map((translation) => ({
                locale: translation.locale,
                name: translation.name,
                description: translation.description ?? undefined,
              })),
              tx,
            );

            results.push({
              ref: groupRef,
              entity: 'tag_group',
              slug: group.slug,
              status: 'created',
              id: groupId,
            });
          } else if (options.onDuplicate === 'upsert') {
            const groupUpdatePayload: { isActive?: boolean } = {};
            if (group.isActive !== undefined) {
              groupUpdatePayload.isActive = group.isActive;
            }
            if (Object.keys(groupUpdatePayload).length > 0) {
              await this.tagGroupRepository.update(groupId, groupUpdatePayload, tx);
            }
            if (group.translations?.length) {
              await this.tagGroupRepository.upsertTranslations(
                groupId,
                group.translations.map((translation) => ({
                  locale: translation.locale,
                  name: translation.name,
                  description: translation.description ?? undefined,
                })),
                tx,
              );
            }

            const groupResult = results.find(
              (row) => row.ref === groupRef && row.entity === 'tag_group',
            );
            if (groupResult) {
              delete groupResult.message;
            }
          } else if (
            !results.some(
              (row) =>
                row.ref === groupRef &&
                row.entity === 'tag_group' &&
                row.status === 'skipped',
            )
          ) {
            results.push({
              ref: groupRef,
              entity: 'tag_group',
              slug: group.slug,
              status: 'skipped',
              id: groupId,
              message: 'Group already exists',
            });
          }

          const tagsToCreate = group.tags.filter(
            (tag) => !existingTagSlugs.has(tag.slug),
          );
          const tagsToUpdate = group.tags.filter((tag) =>
            existingTagSlugs.has(tag.slug),
          );

          for (const tag of tagsToUpdate) {
            if (options.onDuplicate !== 'upsert') continue;

            const existingTag = existingTagBySlug.get(tag.slug)!;
            const tagUpdatePayload: { isActive?: boolean } = {};
            if (tag.isActive !== undefined) {
              tagUpdatePayload.isActive = tag.isActive;
            }
            if (Object.keys(tagUpdatePayload).length > 0) {
              await this.tagRepository.update(
                existingTag.id,
                tagUpdatePayload,
                tx,
              );
            }
            await this.tagRepository.upsertTranslations(
              existingTag.id,
              tag.translations.map((translation) => ({
                locale: translation.locale,
                name: translation.name,
                description: translation.description ?? undefined,
              })),
              tx,
            );

            const tagIndex = group.tags.findIndex(
              (groupTag) => groupTag.slug === tag.slug,
            );
            const tagResult = results.find(
              (row) => row.ref === `${groupRef}.tags[${tagIndex}]`,
            );
            if (tagResult) {
              delete tagResult.message;
            }
          }

          if (tagsToCreate.length === 0) {
            continue;
          }

          const insertedTags = await this.tagRepository.createMany(
            tagsToCreate.map((tag) => ({
              groupId: groupId!,
              slug: tag.slug,
              isActive: tag.isActive ?? true,
            })),
            tx,
          );

          const tagTranslationsData: TNewTagTranslation[] = [];
          for (let i = 0; i < insertedTags.length; i++) {
            const insertedTag = insertedTags[i];
            const tagDto = tagsToCreate[i];
            for (const translation of tagDto.translations) {
              tagTranslationsData.push({
                tagId: insertedTag.id,
                locale: translation.locale,
                name: translation.name,
                description: translation.description ?? undefined,
              });
            }

            const tagIndex = group.tags.findIndex(
              (tag) => tag.slug === tagDto.slug,
            );
            results.push({
              ref: `${groupRef}.tags[${tagIndex}]`,
              entity: 'tag',
              slug: tagDto.slug,
              status: 'created',
              id: insertedTag.id,
            });
          }

          if (tagTranslationsData.length > 0) {
            await this.tagRepository.createManyTranslations(
              tagTranslationsData,
              tx,
            );
          }

          await this.tagGroupRepository.incrementTagCount(
            groupId,
            insertedTags.length,
            tx,
          );
        }
      });
    } catch (error: unknown) {
      if ((error as { code?: string }).code === '23505') {
        throw new BadRequestException(
          'A slug conflict occurred during import. No changes were saved.',
        );
      }
      throw error;
    }

    return this.buildResult(false, true, results);
  }

  private assertUniqueGroupSlugsInBatch(groups: NormalizedGroupImport[]): void {
    const seen = new Set<string>();
    for (const group of groups) {
      if (seen.has(group.slug)) {
        throw new BadRequestException(
          `Duplicate group slug in import payload: '${group.slug}'`,
        );
      }
      seen.add(group.slug);
    }
  }

  private assertUniqueTagSlugsInBatch(groups: NormalizedGroupImport[]): void {
    const seen = new Set<string>();
    for (const group of groups) {
      for (const tag of group.tags) {
        if (seen.has(tag.slug)) {
          throw new BadRequestException(
            `Duplicate tag slug in import payload: '${tag.slug}'`,
          );
        }
        seen.add(tag.slug);
      }
    }
  }

  private buildResult(
    dryRun: boolean,
    success: boolean,
    results: BulkImportTagGroupsRowResult[],
  ): BulkImportTagGroupsResult {
    const groupsCreated = results.filter(
      (row) => row.entity === 'tag_group' && row.status === 'created',
    ).length;
    const tagsCreated = results.filter(
      (row) => row.entity === 'tag' && row.status === 'created',
    ).length;
    const skipped = results.filter((row) => row.status === 'skipped').length;
    const updated = results.filter((row) => row.status === 'updated').length;
    const errors = results.filter((row) => row.status === 'error').length;

    return {
      dryRun,
      success,
      summary: {
        created: groupsCreated + tagsCreated,
        skipped,
        updated,
        errors,
        groupsCreated,
        tagsCreated,
      },
      results,
    };
  }
}
