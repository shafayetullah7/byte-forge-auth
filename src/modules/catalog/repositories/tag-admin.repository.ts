import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, exists, ilike, isNull, sql } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { tagsTable, tagTranslationsTable } from '@/_db/drizzle/schema/taxonomy';
import { languagesTable } from '@/_db/drizzle/schema/i18n/language.schema';
import { isUuid } from '@/common/utils/is-uuid.util';
import type { TagQueryDto } from '../controllers/dto/tag-query.dto';

@Injectable()
export class TagAdminRepository {
  constructor(private readonly db: DrizzleService) {}

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

  async listPaginated(query: TagQueryDto) {
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

    return { data, total, page, limit };
  }

  async findByIdOrSlug(idOrSlug: string) {
    const isIdUuid = isUuid(idOrSlug);
    const lookupCondition = isIdUuid
      ? eq(tagsTable.id, idOrSlug)
      : eq(tagsTable.slug, idOrSlug);

    return this.db.client.query.tagsTable.findFirst({
      where: and(lookupCondition, isNull(tagsTable.deletedAt)),
      with: { translations: true },
    });
  }

  async listTranslations(tagId: string) {
    return this.db.client.query.tagTranslationsTable.findMany({
      where: eq(tagTranslationsTable.tagId, tagId),
    });
  }

  async findLanguageByCode(code: string) {
    return this.db.client.query.languagesTable.findFirst({
      where: eq(languagesTable.code, code),
    });
  }

  async upsertTranslation(
    tagId: string,
    data: { locale: string; name: string; description?: string },
  ) {
    const [translation] = await this.db.client
      .insert(tagTranslationsTable)
      .values({
        tagId,
        locale: data.locale,
        name: data.name,
        description: data.description,
      })
      .onConflictDoUpdate({
        target: [tagTranslationsTable.tagId, tagTranslationsTable.locale],
        set: { name: data.name, description: data.description },
      })
      .returning();

    return translation;
  }

  async deleteTranslation(tagId: string, locale: string) {
    return this.db.client
      .delete(tagTranslationsTable)
      .where(
        and(
          eq(tagTranslationsTable.tagId, tagId),
          eq(tagTranslationsTable.locale, locale),
        ),
      )
      .returning();
  }
}
