import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, exists, ilike, isNull, sql } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  tagGroupsTable,
  tagGroupTranslationsTable,
  tagsTable,
} from '@/_db/drizzle/schema/taxonomy';
import { languagesTable } from '@/_db/drizzle/schema/i18n/language.schema';
import { isUuid } from '@/common/utils/is-uuid.util';
import type { TagGroupQueryDto } from '../controllers/dto/tag-group-query.dto';

@Injectable()
export class TagGroupAdminRepository {
  constructor(private readonly db: DrizzleService) {}

  async listPaginated(query: TagGroupQueryDto) {
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

    return { groups, total, page, limit };
  }

  async findByIdOrSlug(idOrSlug: string) {
    const isIdUuid = isUuid(idOrSlug);
    const lookupCondition = isIdUuid
      ? eq(tagGroupsTable.id, idOrSlug)
      : eq(tagGroupsTable.slug, idOrSlug);

    return this.db.client.query.tagGroupsTable.findFirst({
      where: and(lookupCondition, isNull(tagGroupsTable.deletedAt)),
      with: { translations: true },
    });
  }

  async hasActiveTags(groupId: string): Promise<boolean> {
    const relatedTags = await this.db.client
      .select({ id: tagsTable.id })
      .from(tagsTable)
      .where(and(eq(tagsTable.groupId, groupId), isNull(tagsTable.deletedAt)))
      .limit(1);

    return relatedTags.length > 0;
  }

  async listTranslations(groupId: string) {
    return this.db.client.query.tagGroupTranslationsTable.findMany({
      where: eq(tagGroupTranslationsTable.groupId, groupId),
    });
  }

  async findLanguageByCode(code: string) {
    return this.db.client.query.languagesTable.findFirst({
      where: eq(languagesTable.code, code),
    });
  }

  async upsertTranslation(
    groupId: string,
    data: { locale: string; name: string; description?: string },
  ) {
    const [translation] = await this.db.client
      .insert(tagGroupTranslationsTable)
      .values({
        groupId,
        locale: data.locale,
        name: data.name,
        description: data.description,
      })
      .onConflictDoUpdate({
        target: [
          tagGroupTranslationsTable.groupId,
          tagGroupTranslationsTable.locale,
        ],
        set: { name: data.name, description: data.description },
      })
      .returning();

    return translation;
  }

  async deleteTranslation(groupId: string, locale: string) {
    return this.db.client
      .delete(tagGroupTranslationsTable)
      .where(
        and(
          eq(tagGroupTranslationsTable.groupId, groupId),
          eq(tagGroupTranslationsTable.locale, locale),
        ),
      )
      .returning();
  }
}
