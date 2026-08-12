import { Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { DrizzleTx } from '@/_db/drizzle/types';
import {
  shopArticlesTable,
  shopArticleTranslationsTable,
} from '@/_db/drizzle/schema/shop';
import { ShopContentModerationStatusEnum } from '@/_db/drizzle/enum';
import { slugifyShopContentName } from '@/libs/utils/slugify-shop-content.util';
import type {
  AdminArticleListQuery,
  ArticleTranslationInput,
  SellerArticleListQuery,
} from './article.repository.types';
import { ARTICLE_LOCALES } from './article.repository.types';

export type {
  AdminArticleListQuery,
  ArticleTranslationInput,
  SellerArticleListQuery,
} from './article.repository.types';

@Injectable()
export class ArticleRepository {
  constructor(private readonly db: DrizzleService) {}

  async listByShopId(shopId: string, query: SellerArticleListQuery) {
    const { page, limit, search, moderationStatus, sortOrder = 'desc' } = query;
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [eq(shopArticlesTable.shopId, shopId)];

    if (moderationStatus) {
      conditions.push(
        eq(
          shopArticlesTable.moderationStatus,
          moderationStatus as (typeof ShopContentModerationStatusEnum)[keyof typeof ShopContentModerationStatusEnum],
        ),
      );
    }
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(shopArticlesTable.slug, term),
          sql`exists (
            select 1 from ${shopArticleTranslationsTable}
            where ${shopArticleTranslationsTable.articleId} = ${shopArticlesTable.id}
            and ${shopArticleTranslationsTable.title} ilike ${term}
          )`,
        )!,
      );
    }

    const where = and(...conditions);
    const order =
      sortOrder === 'asc'
        ? asc(shopArticlesTable.createdAt)
        : desc(shopArticlesTable.createdAt);

    const [rows, totalResult] = await Promise.all([
      this.db.client.query.shopArticlesTable.findMany({
        where,
        orderBy: order,
        limit,
        offset,
        with: { translations: true, coverImage: true },
      }),
      this.db.client
        .select({ total: count() })
        .from(shopArticlesTable)
        .where(where),
    ]);

    const total = totalResult[0]?.total ?? 0;
    return {
      data: rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  findByIdForShop(shopId: string, articleId: string, tx?: DrizzleTx) {
    const executor = this.db.getExecutor(tx);
    return executor.query.shopArticlesTable.findFirst({
      where: and(
        eq(shopArticlesTable.id, articleId),
        eq(shopArticlesTable.shopId, shopId),
      ),
      with: { translations: true, coverImage: true },
    });
  }

  findApprovedByShopSlug(shopId: string, articleSlug: string) {
    return this.db.client.query.shopArticlesTable.findFirst({
      where: and(
        eq(shopArticlesTable.shopId, shopId),
        eq(shopArticlesTable.slug, articleSlug),
        eq(
          shopArticlesTable.moderationStatus,
          ShopContentModerationStatusEnum.APPROVED,
        ),
      ),
      with: { translations: true, coverImage: true },
    });
  }

  listApprovedByShopId(shopId: string) {
    return this.db.client.query.shopArticlesTable.findMany({
      where: and(
        eq(shopArticlesTable.shopId, shopId),
        eq(
          shopArticlesTable.moderationStatus,
          ShopContentModerationStatusEnum.APPROVED,
        ),
      ),
      orderBy: [
        desc(shopArticlesTable.isEditorsPick),
        desc(shopArticlesTable.publishedAt),
      ],
      with: { translations: true, coverImage: true },
    });
  }

  async listAdmin(query: AdminArticleListQuery) {
    const { page, limit, search, moderationStatus } = query;
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];

    if (moderationStatus) {
      conditions.push(
        eq(
          shopArticlesTable.moderationStatus,
          moderationStatus as (typeof ShopContentModerationStatusEnum)[keyof typeof ShopContentModerationStatusEnum],
        ),
      );
    } else {
      conditions.push(
        eq(
          shopArticlesTable.moderationStatus,
          ShopContentModerationStatusEnum.PENDING,
        ),
      );
    }

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(shopArticlesTable.slug, term),
          sql`exists (
            select 1 from ${shopArticleTranslationsTable}
            where ${shopArticleTranslationsTable.articleId} = ${shopArticlesTable.id}
            and ${shopArticleTranslationsTable.title} ilike ${term}
          )`,
        )!,
      );
    }

    const where = and(...conditions);
    const [rows, totalResult] = await Promise.all([
      this.db.client.query.shopArticlesTable.findMany({
        where,
        orderBy: asc(shopArticlesTable.createdAt),
        limit,
        offset,
        with: {
          translations: true,
          coverImage: true,
          shop: { with: { translations: true } },
        },
      }),
      this.db.client
        .select({ total: count() })
        .from(shopArticlesTable)
        .where(where),
    ]);

    const total = totalResult[0]?.total ?? 0;
    return {
      data: rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  findByIdForAdmin(articleId: string) {
    return this.db.client.query.shopArticlesTable.findFirst({
      where: eq(shopArticlesTable.id, articleId),
      with: {
        translations: true,
        coverImage: true,
        shop: { with: { translations: true } },
      },
    });
  }

  countApprovedByShopId(shopId: string) {
    return this.db.client
      .select({ total: count() })
      .from(shopArticlesTable)
      .where(
        and(
          eq(shopArticlesTable.shopId, shopId),
          eq(
            shopArticlesTable.moderationStatus,
            ShopContentModerationStatusEnum.APPROVED,
          ),
        ),
      );
  }

  async slugExists(
    shopId: string,
    slug: string,
    excludeId?: string,
    tx?: DrizzleTx,
  ) {
    const executor = this.db.getExecutor(tx);
    const row = await executor.query.shopArticlesTable.findFirst({
      where: and(
        eq(shopArticlesTable.shopId, shopId),
        eq(shopArticlesTable.slug, slug),
      ),
      columns: { id: true },
    });
    if (!row) return false;
    if (excludeId && row.id === excludeId) return false;
    return true;
  }

  async generateUniqueSlug(
    shopId: string,
    baseName: string,
    tx?: DrizzleTx,
  ): Promise<string> {
    const base = slugifyShopContentName(baseName) || 'article';
    let candidate = base;
    let suffix = 2;
    while (await this.slugExists(shopId, candidate, undefined, tx)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  async createArticle(
    data: typeof shopArticlesTable.$inferInsert,
    translations: ArticleTranslationInput,
    tx?: DrizzleTx,
  ) {
    const run = async (executor: DrizzleTx) => {
      const [article] = await executor
        .insert(shopArticlesTable)
        .values(data)
        .returning();
      await this.upsertTranslations(article.id, translations, executor);
      return this.findByIdForShop(data.shopId, article.id, executor);
    };
    if (tx) return run(tx);
    return this.db.transaction(run);
  }

  async updateArticle(
    shopId: string,
    articleId: string,
    data: Partial<typeof shopArticlesTable.$inferInsert>,
    translations?: ArticleTranslationInput,
    tx?: DrizzleTx,
  ) {
    const run = async (executor: DrizzleTx) => {
      await executor
        .update(shopArticlesTable)
        .set(data)
        .where(
          and(
            eq(shopArticlesTable.id, articleId),
            eq(shopArticlesTable.shopId, shopId),
          ),
        );
      if (translations) {
        await this.upsertTranslations(articleId, translations, executor);
      }
      return this.findByIdForShop(shopId, articleId, executor);
    };
    if (tx) return run(tx);
    return this.db.transaction(run);
  }

  async upsertTranslations(
    articleId: string,
    translations: ArticleTranslationInput,
    tx: DrizzleTx,
  ) {
    for (const locale of ARTICLE_LOCALES) {
      const t = translations[locale];
      await tx
        .insert(shopArticleTranslationsTable)
        .values({
          articleId,
          locale,
          title: t.title,
          excerpt: t.excerpt ?? null,
          body: t.body ?? null,
        })
        .onConflictDoUpdate({
          target: [
            shopArticleTranslationsTable.articleId,
            shopArticleTranslationsTable.locale,
          ],
          set: {
            title: t.title,
            excerpt: t.excerpt ?? null,
            body: t.body ?? null,
          },
        });
    }
  }

  async deleteArticle(shopId: string, articleId: string) {
    return this.db.client
      .delete(shopArticlesTable)
      .where(
        and(
          eq(shopArticlesTable.id, articleId),
          eq(shopArticlesTable.shopId, shopId),
        ),
      )
      .returning();
  }

  async updateModerationStatus(
    articleId: string,
    status: (typeof ShopContentModerationStatusEnum)[keyof typeof ShopContentModerationStatusEnum],
    fields?: {
      rejectedReason?: string | null;
      moderatedByAdminId?: string | null;
      moderatedAt?: Date | null;
      publishedAt?: Date | null;
    },
  ) {
    const [updated] = await this.db.client
      .update(shopArticlesTable)
      .set({
        moderationStatus: status,
        rejectedReason: fields?.rejectedReason,
        moderatedByAdminId: fields?.moderatedByAdminId,
        moderatedAt: fields?.moderatedAt,
        publishedAt: fields?.publishedAt,
      })
      .where(eq(shopArticlesTable.id, articleId))
      .returning();
    return updated;
  }

  async setEditorsPick(
    articleId: string,
    isEditorsPick: boolean,
    adminId: string | null,
  ) {
    const [updated] = await this.db.client
      .update(shopArticlesTable)
      .set({
        isEditorsPick,
        editorsPickByAdminId: isEditorsPick ? adminId : null,
        editorsPickAt: isEditorsPick ? new Date() : null,
      })
      .where(eq(shopArticlesTable.id, articleId))
      .returning();
    return updated;
  }
}
