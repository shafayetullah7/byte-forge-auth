import { Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, isNotNull, isNull } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { DrizzleTx } from '@/libs/db/types';
import {
  shopWhyChooseUsTable,
  shopWhyChooseUsTranslationsTable,
  shopValuePointsTable,
  shopValuePointTranslationsTable,
} from '@/_db/drizzle/schema/shop';
import {
  categoriesTable,
  categoryTranslationsTable,
  plantDetailsTable,
  productsTable,
} from '@/_db/drizzle/schema';

export type StorefrontListItemInput = {
  id?: string;
  translations: {
    en: { text: string };
    bn: { text: string };
  };
};

export type StorefrontListItemWithTranslations = {
  id: string;
  shopId: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  translations: Array<{
    id: string;
    locale: string;
    text: string;
  }>;
};

const MAX_LIST_ITEMS = 10;
const LOCALES = ['en', 'bn'] as const;

@Injectable()
export class ShopStorefrontRepository {
  constructor(private readonly db: DrizzleService) {}

  listWhyChooseUs(shopId: string, tx?: DrizzleTx) {
    const executor = this.db.getExecutor(tx);
    return executor.query.shopWhyChooseUsTable.findMany({
      where: eq(shopWhyChooseUsTable.shopId, shopId),
      orderBy: asc(shopWhyChooseUsTable.displayOrder),
      with: { translations: true },
    });
  }

  listValuePoints(shopId: string, tx?: DrizzleTx) {
    const executor = this.db.getExecutor(tx);
    return executor.query.shopValuePointsTable.findMany({
      where: eq(shopValuePointsTable.shopId, shopId),
      orderBy: asc(shopValuePointsTable.displayOrder),
      with: { translations: true },
    });
  }

  async replaceWhyChooseUs(
    shopId: string,
    items: StorefrontListItemInput[],
    tx?: DrizzleTx,
  ) {
    const run = async (executor: DrizzleTx) => {
      await this.replaceWhyChooseUsItems(shopId, items, executor);
      return this.listWhyChooseUs(shopId, executor);
    };

    if (tx) return run(tx);
    return this.db.transaction(run);
  }

  async replaceValuePoints(
    shopId: string,
    items: StorefrontListItemInput[],
    tx?: DrizzleTx,
  ) {
    const run = async (executor: DrizzleTx) => {
      await this.replaceValuePointItems(shopId, items, executor);
      return this.listValuePoints(shopId, executor);
    };

    if (tx) return run(tx);
    return this.db.transaction(run);
  }

  async getCategoriesServed(shopId: string, lang: string): Promise<string[]> {
    const rows = await this.db.client
      .select({
        name: categoryTranslationsTable.name,
      })
      .from(productsTable)
      .innerJoin(
        plantDetailsTable,
        eq(plantDetailsTable.productId, productsTable.id),
      )
      .innerJoin(
        categoriesTable,
        eq(categoriesTable.id, plantDetailsTable.categoryId),
      )
      .leftJoin(
        categoryTranslationsTable,
        and(
          eq(categoryTranslationsTable.categoryId, categoriesTable.id),
          eq(categoryTranslationsTable.locale, lang),
        ),
      )
      .where(
        and(
          eq(productsTable.shopId, shopId),
          eq(productsTable.productType, 'plant'),
          eq(productsTable.status, 'ACTIVE'),
          isNotNull(plantDetailsTable.categoryId),
          isNull(categoriesTable.deletedAt),
          eq(categoriesTable.isActive, true),
        ),
      )
      .groupBy(categoriesTable.id, categoryTranslationsTable.name)
      .orderBy(categoryTranslationsTable.name);

    return rows
      .map((row) => row.name)
      .filter((name): name is string => Boolean(name?.trim()));
  }

  private async replaceWhyChooseUsItems(
    shopId: string,
    items: StorefrontListItemInput[],
    executor: DrizzleTx,
  ) {
    if (items.length > MAX_LIST_ITEMS) {
      throw new Error(`Maximum ${MAX_LIST_ITEMS} items allowed`);
    }

    const existing = await executor
      .select({ id: shopWhyChooseUsTable.id })
      .from(shopWhyChooseUsTable)
      .where(eq(shopWhyChooseUsTable.shopId, shopId));

    const existingIds = existing.map((row) => row.id);
    const incomingIds = items
      .map((item) => item.id)
      .filter((id): id is string => Boolean(id));
    const idsToDelete = existingIds.filter((id) => !incomingIds.includes(id));

    if (idsToDelete.length > 0) {
      await executor
        .delete(shopWhyChooseUsTable)
        .where(
          and(
            eq(shopWhyChooseUsTable.shopId, shopId),
            inArray(shopWhyChooseUsTable.id, idsToDelete),
          ),
        );
    }

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      let parentId = item.id;

      if (parentId && existingIds.includes(parentId)) {
        await executor
          .update(shopWhyChooseUsTable)
          .set({ displayOrder: index, isActive: true })
          .where(
            and(
              eq(shopWhyChooseUsTable.id, parentId),
              eq(shopWhyChooseUsTable.shopId, shopId),
            ),
          );
      } else {
        const [inserted] = await executor
          .insert(shopWhyChooseUsTable)
          .values({ shopId, displayOrder: index, isActive: true })
          .returning({ id: shopWhyChooseUsTable.id });
        parentId = inserted.id;
      }

      for (const locale of LOCALES) {
        const text = item.translations[locale].text.trim();
        await executor
          .insert(shopWhyChooseUsTranslationsTable)
          .values({ whyChooseUsId: parentId, locale, text })
          .onConflictDoUpdate({
            target: [
              shopWhyChooseUsTranslationsTable.whyChooseUsId,
              shopWhyChooseUsTranslationsTable.locale,
            ],
            set: { text },
          });
      }
    }
  }

  private async replaceValuePointItems(
    shopId: string,
    items: StorefrontListItemInput[],
    executor: DrizzleTx,
  ) {
    if (items.length > MAX_LIST_ITEMS) {
      throw new Error(`Maximum ${MAX_LIST_ITEMS} items allowed`);
    }

    const existing = await executor
      .select({ id: shopValuePointsTable.id })
      .from(shopValuePointsTable)
      .where(eq(shopValuePointsTable.shopId, shopId));

    const existingIds = existing.map((row) => row.id);
    const incomingIds = items
      .map((item) => item.id)
      .filter((id): id is string => Boolean(id));
    const idsToDelete = existingIds.filter((id) => !incomingIds.includes(id));

    if (idsToDelete.length > 0) {
      await executor
        .delete(shopValuePointsTable)
        .where(
          and(
            eq(shopValuePointsTable.shopId, shopId),
            inArray(shopValuePointsTable.id, idsToDelete),
          ),
        );
    }

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      let parentId = item.id;

      if (parentId && existingIds.includes(parentId)) {
        await executor
          .update(shopValuePointsTable)
          .set({ displayOrder: index, isActive: true })
          .where(
            and(
              eq(shopValuePointsTable.id, parentId),
              eq(shopValuePointsTable.shopId, shopId),
            ),
          );
      } else {
        const [inserted] = await executor
          .insert(shopValuePointsTable)
          .values({ shopId, displayOrder: index, isActive: true })
          .returning({ id: shopValuePointsTable.id });
        parentId = inserted.id;
      }

      for (const locale of LOCALES) {
        const text = item.translations[locale].text.trim();
        await executor
          .insert(shopValuePointTranslationsTable)
          .values({ valuePointId: parentId, locale, text })
          .onConflictDoUpdate({
            target: [
              shopValuePointTranslationsTable.valuePointId,
              shopValuePointTranslationsTable.locale,
            ],
            set: { text },
          });
      }
    }
  }
}
