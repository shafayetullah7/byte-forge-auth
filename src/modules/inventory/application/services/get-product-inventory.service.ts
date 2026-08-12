import { Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  inventoryTable,
  productVariantsTable,
  productsTable,
} from '@/_db/drizzle/schema';

@Injectable()
export class GetProductInventoryService {
  private readonly logger = new Logger(GetProductInventoryService.name);

  constructor(private readonly db: DrizzleService) {}

  async execute(shopId: string, productId: string) {
    try {
      // First verify the product exists and belongs to the shop
      const [product] = await this.db.client
        .select({
          id: productsTable.id,
          slug: productsTable.slug,
        })
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
        return null; // Product doesn't exist or doesn't belong to shop
      }

      // Get all variants for this product
      const variants = await this.db.client
        .select()
        .from(productVariantsTable)
        .where(eq(productVariantsTable.productId, productId))
        .orderBy(productVariantsTable.displayOrder)
        .execute();

      // Get inventory records for these variants
      const variantIds = variants.map((v) => v.id);
      let inventoryRecords: (typeof inventoryTable.$inferSelect)[] = [];

      if (variantIds.length > 0) {
        inventoryRecords = await this.db.client
          .select()
          .from(inventoryTable)
          .where(inArray(inventoryTable.variantId, variantIds))
          .execute();
      }

      // Create a map of variantId -> inventory record
      const inventoryMap = new Map(
        inventoryRecords.map((inv) => [inv.variantId, inv]),
      );

      // Map all variants, using inventory data if available, otherwise defaults
      const mappedVariants = variants.map((variant) => {
        const inventory = inventoryMap.get(variant.id);

        if (!inventory) {
          // No inventory record yet - return zero stock
          return {
            inventoryId: '',
            variantId: variant.id,
            sku: variant.sku,
            variantName: null,
            price: variant.price,
            quantity: 0,
            reservedQuantity: 0,
            availableQuantity: 0,
            lowStockThreshold: variant.lowStockThreshold ?? 5,
            trackInventory: variant.trackInventory ?? true,
            allowBackorder: false,
            status: 'out_of_stock' as const,
            lastStockUpdate: new Date(),
          };
        }

        const availableQuantity =
          inventory.quantity - inventory.reservedQuantity;

        let status: 'in_stock' | 'low_stock' | 'out_of_stock';
        if (availableQuantity === 0) {
          status = 'out_of_stock';
        } else if (availableQuantity <= inventory.lowStockThreshold) {
          status = 'low_stock';
        } else {
          status = 'in_stock';
        }

        return {
          inventoryId: inventory.id,
          variantId: variant.id,
          sku: variant.sku,
          variantName: null,
          price: variant.price,
          quantity: inventory.quantity,
          reservedQuantity: inventory.reservedQuantity,
          availableQuantity,
          lowStockThreshold: inventory.lowStockThreshold,
          trackInventory: inventory.trackInventory,
          allowBackorder: inventory.allowBackorder,
          status,
          lastStockUpdate: inventory.updatedAt,
        };
      });

      const totalStock = mappedVariants.reduce((sum, v) => sum + v.quantity, 0);
      const reservedStock = mappedVariants.reduce(
        (sum, v) => sum + v.reservedQuantity,
        0,
      );
      const availableStock = totalStock - reservedStock;
      const lowStockCount = mappedVariants.filter(
        (v) =>
          v.availableQuantity > 0 && v.availableQuantity <= v.lowStockThreshold,
      ).length;
      const outOfStockCount = mappedVariants.filter(
        (v) => v.availableQuantity === 0,
      ).length;

      return {
        productId: product.id,
        productName: product.id,
        productSlug: product.slug,
        totalStock,
        reservedStock,
        availableStock,
        lowStockCount,
        outOfStockCount,
        variants: mappedVariants,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch inventory for product ${productId} in shop ${shopId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
