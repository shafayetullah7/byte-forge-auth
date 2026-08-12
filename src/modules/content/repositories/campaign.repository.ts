import { Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { DrizzleTx } from '@/_db/drizzle/types';
import {
  shopCampaignProductsTable,
  shopCampaignsTable,
  shopCampaignTranslationsTable,
} from '@/_db/drizzle/schema/shop';
import {
  ProductStatusEnum,
  ShopContentModerationStatusEnum,
} from '@/_db/drizzle/enum';
import { productsTable } from '@/_db/drizzle/schema';
import { slugifyShopContentName } from '@/libs/utils/slugify-shop-content.util';
import type {
  AdminCampaignListQuery,
  CampaignTranslationInput,
  SellerCampaignListQuery,
} from './campaign.repository.types';
import { CAMPAIGN_LOCALES } from './campaign.repository.types';

export type {
  AdminCampaignListQuery,
  CampaignTranslationInput,
  SellerCampaignListQuery,
} from './campaign.repository.types';

@Injectable()
export class CampaignRepository {
  constructor(private readonly db: DrizzleService) {}

  async listByShopId(shopId: string, query: SellerCampaignListQuery) {
    const { page, limit, search, moderationStatus, sortOrder = 'desc' } = query;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(shopCampaignsTable.shopId, shopId)];
    if (moderationStatus) {
      conditions.push(
        eq(
          shopCampaignsTable.moderationStatus,
          moderationStatus as (typeof ShopContentModerationStatusEnum)[keyof typeof ShopContentModerationStatusEnum],
        ),
      );
    }
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(shopCampaignsTable.slug, term),
          sql`exists (
            select 1 from ${shopCampaignTranslationsTable}
            where ${shopCampaignTranslationsTable.campaignId} = ${shopCampaignsTable.id}
            and ${shopCampaignTranslationsTable.title} ilike ${term}
          )`,
        )!,
      );
    }

    const where = and(...conditions);
    const order =
      sortOrder === 'asc'
        ? asc(shopCampaignsTable.createdAt)
        : desc(shopCampaignsTable.createdAt);

    const [rows, totalResult] = await Promise.all([
      this.db.client.query.shopCampaignsTable.findMany({
        where,
        orderBy: order,
        limit,
        offset,
        with: {
          translations: true,
          banner: true,
          products: true,
        },
      }),
      this.db.client
        .select({ total: count() })
        .from(shopCampaignsTable)
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

  findByIdForShop(shopId: string, campaignId: string, tx?: DrizzleTx) {
    const executor = this.db.getExecutor(tx);
    return executor.query.shopCampaignsTable.findFirst({
      where: and(
        eq(shopCampaignsTable.id, campaignId),
        eq(shopCampaignsTable.shopId, shopId),
      ),
      with: {
        translations: true,
        banner: true,
        products: { with: { product: { with: { translations: true } } } },
      },
    });
  }

  findApprovedByShopSlug(shopId: string, campaignSlug: string, tx?: DrizzleTx) {
    const executor = this.db.getExecutor(tx);
    return executor.query.shopCampaignsTable.findFirst({
      where: and(
        eq(shopCampaignsTable.shopId, shopId),
        eq(shopCampaignsTable.slug, campaignSlug),
        eq(
          shopCampaignsTable.moderationStatus,
          ShopContentModerationStatusEnum.APPROVED,
        ),
      ),
      with: {
        translations: true,
        banner: true,
        products: {
          with: {
            product: {
              with: { translations: true, thumbnail: true, variants: true },
            },
          },
        },
      },
    });
  }

  listApprovedByShopId(shopId: string) {
    return this.db.client.query.shopCampaignsTable.findMany({
      where: and(
        eq(shopCampaignsTable.shopId, shopId),
        eq(
          shopCampaignsTable.moderationStatus,
          ShopContentModerationStatusEnum.APPROVED,
        ),
      ),
      orderBy: desc(shopCampaignsTable.startDate),
      with: { translations: true, banner: true, products: true },
    });
  }

  async listAdmin(query: AdminCampaignListQuery) {
    const { page, limit, search, moderationStatus } = query;
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];

    if (moderationStatus) {
      conditions.push(
        eq(
          shopCampaignsTable.moderationStatus,
          moderationStatus as (typeof ShopContentModerationStatusEnum)[keyof typeof ShopContentModerationStatusEnum],
        ),
      );
    } else {
      conditions.push(
        eq(
          shopCampaignsTable.moderationStatus,
          ShopContentModerationStatusEnum.PENDING,
        ),
      );
    }

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(shopCampaignsTable.slug, term),
          sql`exists (
            select 1 from ${shopCampaignTranslationsTable}
            where ${shopCampaignTranslationsTable.campaignId} = ${shopCampaignsTable.id}
            and ${shopCampaignTranslationsTable.title} ilike ${term}
          )`,
        )!,
      );
    }

    const where = and(...conditions);
    const [rows, totalResult] = await Promise.all([
      this.db.client.query.shopCampaignsTable.findMany({
        where,
        orderBy: asc(shopCampaignsTable.createdAt),
        limit,
        offset,
        with: {
          translations: true,
          banner: true,
          shop: { with: { translations: true } },
        },
      }),
      this.db.client
        .select({ total: count() })
        .from(shopCampaignsTable)
        .where(where),
    ]);

    const total = totalResult[0]?.total ?? 0;
    return {
      data: rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  findByIdForAdmin(campaignId: string) {
    return this.db.client.query.shopCampaignsTable.findFirst({
      where: eq(shopCampaignsTable.id, campaignId),
      with: {
        translations: true,
        banner: true,
        products: { with: { product: { with: { translations: true } } } },
        shop: { with: { translations: true } },
      },
    });
  }

  countApprovedByShopId(shopId: string) {
    return this.db.client
      .select({ total: count() })
      .from(shopCampaignsTable)
      .where(
        and(
          eq(shopCampaignsTable.shopId, shopId),
          eq(
            shopCampaignsTable.moderationStatus,
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
    const row = await executor.query.shopCampaignsTable.findFirst({
      where: and(
        eq(shopCampaignsTable.shopId, shopId),
        eq(shopCampaignsTable.slug, slug),
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
    const base = slugifyShopContentName(baseName) || 'campaign';
    let candidate = base;
    let suffix = 2;
    while (await this.slugExists(shopId, candidate, undefined, tx)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  async createCampaign(
    data: typeof shopCampaignsTable.$inferInsert,
    translations: CampaignTranslationInput,
    productIds: string[],
    tx?: DrizzleTx,
  ) {
    const run = async (executor: DrizzleTx) => {
      const [campaign] = await executor
        .insert(shopCampaignsTable)
        .values(data)
        .returning();

      await this.upsertTranslations(campaign.id, translations, executor);
      if (productIds.length > 0) {
        await this.replaceProducts(campaign.id, productIds, executor);
      }

      return this.findByIdForShop(data.shopId, campaign.id, executor);
    };

    if (tx) return run(tx);
    return this.db.transaction(run);
  }

  async updateCampaign(
    shopId: string,
    campaignId: string,
    data: Partial<typeof shopCampaignsTable.$inferInsert>,
    translations?: CampaignTranslationInput,
    productIds?: string[],
    tx?: DrizzleTx,
  ) {
    const run = async (executor: DrizzleTx) => {
      await executor
        .update(shopCampaignsTable)
        .set(data)
        .where(
          and(
            eq(shopCampaignsTable.id, campaignId),
            eq(shopCampaignsTable.shopId, shopId),
          ),
        );

      if (translations) {
        await this.upsertTranslations(campaignId, translations, executor);
      }
      if (productIds !== undefined) {
        await this.replaceProducts(campaignId, productIds, executor);
      }

      return this.findByIdForShop(shopId, campaignId, executor);
    };

    if (tx) return run(tx);
    return this.db.transaction(run);
  }

  async upsertTranslations(
    campaignId: string,
    translations: CampaignTranslationInput,
    tx: DrizzleTx,
  ) {
    for (const locale of CAMPAIGN_LOCALES) {
      const t = translations[locale];
      await tx
        .insert(shopCampaignTranslationsTable)
        .values({
          campaignId,
          locale,
          title: t.title,
          description: t.description ?? null,
        })
        .onConflictDoUpdate({
          target: [
            shopCampaignTranslationsTable.campaignId,
            shopCampaignTranslationsTable.locale,
          ],
          set: {
            title: t.title,
            description: t.description ?? null,
          },
        });
    }
  }

  async replaceProducts(
    campaignId: string,
    productIds: string[],
    tx: DrizzleTx,
  ) {
    await tx
      .delete(shopCampaignProductsTable)
      .where(eq(shopCampaignProductsTable.campaignId, campaignId));

    if (productIds.length === 0) return;

    await tx
      .insert(shopCampaignProductsTable)
      .values(productIds.map((productId) => ({ campaignId, productId })));
  }

  async deleteCampaign(shopId: string, campaignId: string) {
    return this.db.client
      .delete(shopCampaignsTable)
      .where(
        and(
          eq(shopCampaignsTable.id, campaignId),
          eq(shopCampaignsTable.shopId, shopId),
        ),
      )
      .returning();
  }

  async validateProductIdsForShop(
    shopId: string,
    productIds: string[],
    tx?: DrizzleTx,
  ) {
    if (productIds.length === 0) return true;
    const executor = this.db.getExecutor(tx);
    const rows = await executor
      .select({ id: productsTable.id })
      .from(productsTable)
      .where(
        and(
          eq(productsTable.shopId, shopId),
          inArray(productsTable.id, productIds),
          eq(productsTable.status, ProductStatusEnum.ACTIVE),
        ),
      );
    return rows.length === productIds.length;
  }

  async updateModerationStatus(
    campaignId: string,
    status: (typeof ShopContentModerationStatusEnum)[keyof typeof ShopContentModerationStatusEnum],
    fields?: {
      rejectedReason?: string | null;
      moderatedByAdminId?: string | null;
      moderatedAt?: Date | null;
    },
  ) {
    const [updated] = await this.db.client
      .update(shopCampaignsTable)
      .set({
        moderationStatus: status,
        rejectedReason: fields?.rejectedReason,
        moderatedByAdminId: fields?.moderatedByAdminId,
        moderatedAt: fields?.moderatedAt,
      })
      .where(eq(shopCampaignsTable.id, campaignId))
      .returning();
    return updated;
  }
}
