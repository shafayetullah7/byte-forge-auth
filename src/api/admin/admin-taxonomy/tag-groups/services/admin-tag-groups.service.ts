import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateTagGroupDto } from '../dto/create-tag-group.dto';
import { UpdateTagGroupDto } from '../dto/update-tag-group.dto';
import { TagGroupQueryDto } from '../dto/tag-group-query.dto';
import { TagGroupRepository } from '@/modules/catalog/repositories';
import { TagRepository } from '@/modules/catalog/repositories';
import {
  tagGroupsTable,
  TNewTagTranslation,
} from '@/_db/drizzle/schema/taxonomy';

import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { eq, and, isNull, sql, asc, desc, ilike, exists } from 'drizzle-orm';
import {
  tagsTable,
  tagGroupTranslationsTable,
} from '@/_db/drizzle/schema/taxonomy';
import { resolveTranslation } from '@/common/utils/resolve-translation.util';
import { paginate } from '@/common/utils/pagination.util';
import { isUuid } from '@/common/utils/is-uuid.util';

@Injectable()
export class AdminTagGroupsService {
  constructor(
    private readonly tagGroupRepository: TagGroupRepository,
    private readonly tagRepository: TagRepository,
    private readonly db: DrizzleService,
  ) {}

  async create(createTagGroupDto: CreateTagGroupDto) {
    // Check if tag group slug already exists
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
      return await this.db.client.transaction(async (tx) => {
        // 1. Create Tag Group
        const group = await this.tagGroupRepository.create(
          {
            slug: createTagGroupDto.slug,
            isActive: createTagGroupDto.isActive,
          },
          tx,
        );

        // 2. Create Tag Group Translations
        await this.tagGroupRepository.createTranslations(
          group.id,
          createTagGroupDto.translations,
          tx,
        );

        // 3. Process Tags
        if (createTagGroupDto.tags && createTagGroupDto.tags.length > 0) {
          // a. Batch Create Tags
          const tagsData = createTagGroupDto.tags.map((tagDto) => ({
            groupId: group.id,
            slug: tagDto.slug,
            isActive: tagDto.isActive,
          }));
          const insertedTags = await this.tagRepository.createMany(
            tagsData,
            tx,
          );

          // b. Prepare and Batch Create Tag Translations
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

          // c. Update Tag Group count
          await this.tagGroupRepository.incrementTagCount(
            group.id,
            insertedTags.length,
            tx,
          );
        }

        return group;
      });
    } catch (error: unknown) {
      // Catch concurrent-insert race that slips past the pre-checks
      if ((error as { code?: string }).code === '23505') {
        throw new BadRequestException(
          'A slug conflict occurred — the group or one of its tag slugs may already be in use.',
        );
      }
      throw error;
    }
  }

  async findAll(query: TagGroupQueryDto, lang: string) {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const offset = (page - 1) * limit;

    const sortByField =
      query.sortBy === 'updatedAt'
        ? tagGroupsTable.updatedAt
        : tagGroupsTable.createdAt;

    const sortFn = query.sortOrder === 'asc' ? asc : desc;

    const searchCondition =
      query.name || query.search
        ? exists(
            this.db.client
              .select({ id: tagGroupTranslationsTable.id })
              .from(tagGroupTranslationsTable)
              .where(
                and(
                  eq(tagGroupTranslationsTable.groupId, tagGroupsTable.id),
                  query.name
                    ? eq(tagGroupTranslationsTable.name, query.name)
                    : undefined,
                  query.search
                    ? ilike(tagGroupTranslationsTable.name, `%${query.search}%`)
                    : undefined,
                ),
              ),
          )
        : undefined;

    // Apply conditional filters strictly aligned with QUERIES.md
    const conditions = and(
      isNull(tagGroupsTable.deletedAt),
      query.id ? eq(tagGroupsTable.id, query.id) : undefined,
      query.isActive !== undefined
        ? eq(tagGroupsTable.isActive, query.isActive === 'true')
        : undefined,
      searchCondition,
    );

    const [groups, [{ total }]] = await Promise.all([
      this.db.client.query.tagGroupsTable.findMany({
        where: conditions,
        orderBy: [sortFn(sortByField)],
        limit,
        offset,
        with: {
          translations: true,
          tags: {
            limit: 3,
            columns: {
              id: true,
              slug: true,
              isActive: true,
            },
            where: and(
              isNull(tagsTable.deletedAt),
              eq(tagsTable.isActive, true),
            ),
            with: {
              translations: true,
            },
            orderBy: [asc(tagsTable.createdAt)],
          },
        },
      }),
      this.db.client
        .select({ total: sql`count(*)`.mapWith(Number) })
        .from(tagGroupsTable)
        .where(conditions),
    ]);

    const formattedGroups = groups.map((group) => {
      const { translations, tags, ...rest } = group;
      const englishTranslation = translations.find((t) => t.locale === 'en');
      const translation = resolveTranslation(translations, lang);

      const formattedTags = (tags || []).map((tag) => {
        const { translations: tagTranslations, ...tagRest } = tag;
        const tagTranslation = resolveTranslation(tagTranslations, lang);
        return {
          ...tagRest,
          translations: tagTranslations,
          name:
            tagTranslation?.name ||
            tagTranslations.find((t) => t.locale === 'en')?.name ||
            null,
        };
      });

      return {
        ...rest,
        translations,
        name: translation?.name || englishTranslation?.name || null,
        tags: formattedTags,
      };
    });

    return paginate(formattedGroups, total, page, limit);
  }

  async findOne(id: string, lang: string) {
    const isIdUuid = isUuid(id);
    const lookupCondition = isIdUuid
      ? eq(tagGroupsTable.id, id)
      : eq(tagGroupsTable.slug, id);

    const group = await this.db.client.query.tagGroupsTable.findFirst({
      where: and(lookupCondition, isNull(tagGroupsTable.deletedAt)),
      with: { translations: true },
    });

    if (!group)
      throw new NotFoundException(
        `Tag Group with ${isIdUuid ? 'ID' : 'slug'} '${id}' not found`,
      );

    const translation = resolveTranslation(group.translations, lang);
    return {
      ...group,
      name: translation?.name ?? 'Unnamed Group',
    };
  }

  async update(id: string, updateTagGroupDto: UpdateTagGroupDto, lang: string) {
    const group = await this.findOne(id, lang);

    // 1. Validate Target Slug if provided
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

  async remove(id: string, lang: string) {
    const group = await this.findOne(id, lang);

    // Check if tags exist in this group before deleting
    const relatedTags = await this.db.client
      .select({ id: tagsTable.id })
      .from(tagsTable)
      .where(and(eq(tagsTable.groupId, id), isNull(tagsTable.deletedAt)))
      .limit(1);

    if (relatedTags.length > 0) {
      throw new BadRequestException(
        'Cannot delete Tag Group. It currently contains active tags.',
      );
    }
    await this.tagGroupRepository.softDelete(group.id);
  }
}
