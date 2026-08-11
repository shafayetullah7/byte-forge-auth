import { Injectable, Logger } from '@nestjs/common';
import { ProductStatusEnum } from '@/_db/drizzle/enum';
import { CartQueryService } from './cart.query';
import type {
  ValidateCartResult,
  ValidateIssue,
} from './validate-cart.query.types';

@Injectable()
export class ValidateCartQuery {
  private readonly logger = new Logger(ValidateCartQuery.name);

  constructor(private readonly cartQueryService: CartQueryService) {}

  async execute(
    cartId: string,
    locale: string = 'en',
  ): Promise<ValidateCartResult> {
    try {
      const cart = await this.cartQueryService.getCartWithItemsById(cartId);

      if (!cart || cart.items.length === 0) {
        return {
          isValid: true,
          issues: [],
          validItemsCount: 0,
          invalidItemsCount: 0,
        };
      }

      const variantIds = cart.items.map((item) => item.variantId);
      const inventories =
        await this.cartQueryService.getInventoryByVariantIds(variantIds);
      const inventoryMap = new Map(
        inventories.map((inv) => [inv.variantId, inv]),
      );

      const issues: ValidateIssue[] = [];
      let validCount = 0;

      for (const item of cart.items) {
        const variant = item.variant;

        if (!variant) {
          issues.push({
            itemId: item.id,
            variantId: item.variantId,
            productName: 'Unknown Product',
            issue: 'variant_not_found',
            details: 'Product variant no longer exists',
          });
          continue;
        }

        if (!variant.isActive) {
          const product = variant.product;
          const translation = product?.translations?.find(
            (t) => t.locale === locale,
          );
          issues.push({
            itemId: item.id,
            variantId: item.variantId,
            productName: translation?.name ?? 'Unknown Product',
            issue: 'variant_deactivated',
            details: 'This product variant has been deactivated',
          });
          continue;
        }

        const product = variant.product;
        if (!product || product.status !== ProductStatusEnum.ACTIVE) {
          const translation = product?.translations?.find(
            (t) => t.locale === locale,
          );
          issues.push({
            itemId: item.id,
            variantId: item.variantId,
            productName: translation?.name ?? 'Unknown Product',
            issue: 'product_unavailable',
            details: `Product status: ${product?.status ?? 'unknown'}`,
          });
          continue;
        }

        const inventory = inventoryMap.get(item.variantId) ?? null;
        if (inventory?.trackInventory) {
          const availableQuantity =
            inventory.quantity - inventory.reservedQuantity;
          if (availableQuantity < item.quantity) {
            const translation = product?.translations?.find(
              (t) => t.locale === locale,
            );
            issues.push({
              itemId: item.id,
              variantId: item.variantId,
              productName: translation?.name ?? 'Unknown Product',
              issue: 'insufficient_stock',
              details: `Only ${availableQuantity} items available. Cart quantity: ${item.quantity}`,
              availableQuantity,
            });
            continue;
          }
        }

        validCount++;
      }

      return {
        isValid: issues.length === 0,
        issues,
        validItemsCount: validCount,
        invalidItemsCount: issues.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to validate cart ${cartId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
