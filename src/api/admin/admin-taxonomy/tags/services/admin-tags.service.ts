import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateTagDto } from '../dto/create-tag.dto';
import { UpdateTagDto } from '../dto/update-tag.dto';
import { TagQueryDto } from '../dto/tag-query.dto';
import { eq, and, isNull, ilike, asc, desc, sql, exists } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  tagsTable,
  tagGroupsTable,
  tagTranslationsTable,
} from '@/_db/drizzle/schema/taxonomy';
import { TagRepository } from '@/modules/catalog/repositories';
import { TagGroupRepository } from '@/modules/catalog/repositories';
import { paginate } from '@/common/utils/pagination.util';
import { isUuid } from '@/common/utils/is-uuid.util';

@Injectable()
export class AdminTagsService {
  constructor(
    private readonly tagRepository: TagRepository,
    private readonly tagGroupRepository: TagGroupRepository,
    private readonly db: DrizzleService,
  ) {}

  async create(createTagDto: CreateTagDto) {
    // 1. Verify group exists and is not deleted
    const group = await this.tagGroupRepository.findOne(createTagDto.groupId);
    if (!group)
      throw new BadRequestException(
        `Tag Group ${createTagDto.groupId} does not exist.`,
      );

    // 2. Verify tag slug uniqueness
    const existingTags = await this.tagRepository.findBySlugs([
      createTagDto.slug,
    ]);
    if (existingTags.length > 0) {
      throw new BadRequestException(
        `Tag with slug '${createTagDto.slug}' already exists.`,
      );
    }

    try {
      return await this.db.client.transaction(async (tx) => {
        // a. Create Tag
        const tag = await this.tagRepository.create(
          {
            slug: createTagDto.slug,
            groupId: createTagDto.groupId,
            isActive: createTagDto.isActive,
          },
          tx,
        );

        // b. Create Tag Translations
        await this.tagRepository.createTranslations(
          tag.id,
          createTagDto.translations,
          tx,
        );

        // c. Increment Parent Tag Group count
        await this.tagGroupRepository.incrementTagCount(tag.groupId, 1, tx);

        return tag;
      });
    } catch (error: unknown) {
      // Catch concurrent-insert race that slips past the pre-check
      if ((error as { code?: string }).code === '23505') {
        throw new BadRequestException(
          `Tag with slug '${createTagDto.slug}' already exists.`,
        );
      }
      throw error;
    }
  }

  private buildWhere(query: TagQueryDto) {
    const searchCondition =
      query.name || query.search
        ? exists(
            this.db.client
              .select({ id: tagTranslationsTable.id })
              .from(tagTranslationsTable)
              .where(
                and(
                  eq(tagTranslationsTable.tagId, tagsTable.id),
                  query.name
                    ? eq(tagTranslationsTable.name, query.name)
                    : undefined,
                  query.search
                    ? ilike(tagTranslationsTable.name, `%${query.search}%`)
                    : undefined,
                ),
              ),
          )
        : undefined;

    return and(
      isNull(tagsTable.deletedAt),
      query.id ? eq(tagsTable.id, query.id) : undefined,
      query.groupId ? eq(tagsTable.groupId, query.groupId) : undefined,
      query.isActive !== undefined
        ? eq(tagsTable.isActive, query.isActive === 'true')
        : undefined,
      searchCondition,
    );
  }

  async findAll(query: TagQueryDto) {
    const limit = query.limit ? Number(query.limit) : 20;
    const page = query.page ? Number(query.page) : 1;
    const offset = (page - 1) * limit;

    const sortByField =
      query.sortBy === 'updatedAt' ? tagsTable.updatedAt : tagsTable.createdAt;

    const sortFn = query.sortOrder === 'asc' ? asc : desc;
    const conditions = this.buildWhere(query);

    const [data, [{ total }]] = await Promise.all([
      this.db.client.query.tagsTable.findMany({
        where: conditions,
        orderBy: [sortFn(sortByField)],
        limit,
        offset,
        with: { translations: true },
      }),
      this.db.client
        .select({ total: sql`count(*)`.mapWith(Number) })
        .from(tagsTable)
        .where(conditions),
    ]);

    // Admin returns all raw translations, so we just map tag directly
    // unless a specific translation resolution is requested by caller context (for now, admin gets all)
    const formattedData = data.map((tag) => {
      const { translations, ...rest } = tag;
      const englishTranslation = translations.find((t) => t.locale === 'en');
      return {
        ...rest,
        translations,
        name: englishTranslation?.name || null,
      };
    });

    return paginate(formattedData, total, page, limit);
  }

  async findOne(id: string) {
    const isIdUuid = isUuid(id);
    const lookupCondition = isIdUuid
      ? eq(tagsTable.id, id)
      : eq(tagsTable.slug, id);

    const tag = await this.db.client.query.tagsTable.findFirst({
      where: and(lookupCondition, isNull(tagsTable.deletedAt)),
      with: { translations: true },
    });

    if (!tag)
      throw new NotFoundException(
        `Tag with ${isIdUuid ? 'ID' : 'slug'} '${id}' not found`,
      );
    return tag;
  }

  async update(id: string, updateTagDto: UpdateTagDto) {
    const tag = await this.findOne(id);

    // 1. Validate Target Slug if provided
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

    // 2. Validate Target Group if provided
    const isChangingGroup =
      updateTagDto.groupId && updateTagDto.groupId !== tag.groupId;
    if (isChangingGroup) {
      const group = await this.db.client.query.tagGroupsTable.findFirst({
        where: and(
          eq(tagGroupsTable.id, updateTagDto.groupId!),
          isNull(tagGroupsTable.deletedAt),
        ),
      });
      if (!group)
        throw new BadRequestException(
          `Target Tag Group ${updateTagDto.groupId} does not exist or has been deleted.`,
        );
    }

    // 3. Execute DB Operations (in transaction if group is changing)
    try {
      if (isChangingGroup) {
        return await this.db.client.transaction(async (tx) => {
          // a. Decrement Old Group
          await this.tagGroupRepository.decrementTagCount(tag.groupId, 1, tx);

          // b. Increment New Group
          await this.tagGroupRepository.incrementTagCount(
            updateTagDto.groupId!,
            1,
            tx,
          );

          // c. Update the tag
          return await this.tagRepository.update(
            tag.id,
            {
              ...updateTagDto,
              updatedAt: new Date(),
            },
            tx,
          );
        });
      } else {
        // Direct update if group remains the same
        return await this.tagRepository.update(tag.id, {
          ...updateTagDto,
          updatedAt: new Date(),
        });
      }
    } catch (error: unknown) {
      if ((error as { code?: string }).code === '23505') {
        throw new BadRequestException(
          `Tag with slug '${updateTagDto.slug}' already exists.`,
        );
      }
      throw error;
    }
  }

  async remove(id: string) {
    const tag = await this.findOne(id);

    // Check usage before deletion
    if (tag.usageCount > 0) {
      throw new BadRequestException(
        'Cannot delete tag. It is currently being used by products.',
      );
    }

    await this.db.client.transaction(async (tx) => {
      // 1. Soft delete the tag
      await this.tagRepository.softDelete(tag.id, tx);

      // 2. Decrement Parent Tag Group count
      await this.tagGroupRepository.decrementTagCount(tag.groupId, 1, tx);
    });
  }
}
