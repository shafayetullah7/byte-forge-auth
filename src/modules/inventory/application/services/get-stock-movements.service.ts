import { Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray, gte, lte, desc } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  inventoryMovementsTable,
  inventoryTable,
  productVariantsTable,
  productsTable,
} from '@/_db/drizzle/schema';
import { InventoryMovementTypeEnum } from '@/_db/drizzle/enum';

@Injectable()
export class GetStockMovementsService {
  private readonly logger = new Logger(GetStockMovementsService.name);

  constructor(private readonly db: DrizzleService) {}

  async execute(
    shopId: string,
    productId: string,
    filters: {
      variantId?: string;
      movementType?: InventoryMovementTypeEnum;
      startDate?: string;
      endDate?: string;
    },
    page: number,
    limit: number,
  ) {
    try {
      // First verify the product belongs to the shop
      const [product] = await this.db.client
        .select()
        .from(productsTable)
        .where(
          and(
            eq(productsTable.shopId, shopId),
            eq(productsTable.id, productId),
          ),
        )
        .limit(1)
        .execute();

      if (!product) {
        return { movements: [], meta: { total: 0, page, limit, pages: 0 } };
      }

      // Get all inventory records for this product's variants
      const inventoryRecords = await this.db.client
        .select()
        .from(inventoryTable)
        .innerJoin(
          productVariantsTable,
          eq(inventoryTable.variantId, productVariantsTable.id),
        )
        .where(eq(productVariantsTable.productId, productId))
        .execute();

      if (inventoryRecords.length === 0) {
        return { movements: [], meta: { total: 0, page, limit, pages: 0 } };
      }

      const inventoryIds = inventoryRecords.map((r) => r.inventory.id);

      // Build variant map
      const variantMap = new Map(
        inventoryRecords.map((r) => [
          r.inventory.id,
          {
            variantId: r.product_variants.id,
            sku: r.product_variants.sku,
          },
        ]),
      );

      // Build where conditions
      const conditions = [
        inArray(inventoryMovementsTable.inventoryId, inventoryIds),
      ];

      if (filters.movementType) {
        conditions.push(
          eq(inventoryMovementsTable.movementType, filters.movementType),
        );
      }

      if (filters.startDate) {
        conditions.push(
          gte(inventoryMovementsTable.createdAt, new Date(filters.startDate)),
        );
      }

      if (filters.endDate) {
        conditions.push(
          lte(inventoryMovementsTable.createdAt, new Date(filters.endDate)),
        );
      }

      const whereClause = and(...conditions);

      // Get total count
      const countResult = await this.db.client
        .select({ count: this.db.client.$count(inventoryMovementsTable) })
        .from(inventoryMovementsTable)
        .where(whereClause)
        .execute();

      const total = countResult[0]?.count ?? 0;

      // Get paginated movements
      const movements = await this.db.client
        .select()
        .from(inventoryMovementsTable)
        .where(whereClause)
        .orderBy(desc(inventoryMovementsTable.createdAt))
        .limit(limit)
        .offset((page - 1) * limit)
        .execute();

      const mappedMovements = movements.map((m) => {
        const variantInfo = variantMap.get(m.inventoryId);
        return {
          id: m.id,
          inventoryId: m.inventoryId,
          variantId: variantInfo?.variantId ?? '',
          variantSku: variantInfo?.sku ?? null,
          variantName: null,
          movementType: m.movementType,
          quantityChange: m.quantityChange,
          previousQuantity: m.previousQuantity,
          newQuantity: m.newQuantity,
          previousReserved: m.previousReserved,
          newReserved: m.newReserved,
          referenceType: m.referenceType,
          referenceId: m.referenceId,
          reason: m.reason,
          createdBy: m.createdBy,
          createdAt: m.createdAt,
        };
      });

      return {
        movements: mappedMovements,
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit) || 0,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch stock movements for product ${productId} in shop ${shopId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
