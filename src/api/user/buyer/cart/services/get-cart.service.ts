import { Injectable, Logger } from '@nestjs/common';
import { CartRepository } from '@/modules/cart/repositories';
import {
  computeStockStatus,
  computeCartTotals,
  computeLineTotal,
} from '../cart.utils';

export type CartItemResult = {
  id: string;
  variantId: string;
  quantity: number;
  price: string;
  lineTotal: string;
  productName: string;
  productSlug: string;
  productType: string;
  shopId: string;
  thumbnail: { id: string; url: string } | null;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  availableQuantity: number | null;
  maxQuantity: number;
  variantAttributes: {
    growthStage?: string;
    plantForm?: string;
    variegation?: string;
    leafDensity?: string;
    containerType?: string;
    containerSize?: string;
  } | null;
  variantTitle?: string;
  sku?: string;
};

export type CartResult = {
  id: string;
  itemsCount: number;
  totalQuantity: number;
  subtotal: string;
  items: CartItemResult[];
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class GetCartService {
  private readonly logger = new Logger(GetCartService.name);

  constructor(private readonly cartRepository: CartRepository) {}

  async executeByCartId(
    cartId: string,
    locale: string = 'en',
  ): Promise<CartResult | null> {
    try {
      const cart = await this.cartRepository.getCartWithItemsById(cartId);

      if (!cart) {
        return null;
      }

      const variantIds = cart.items.map((item) => item.variantId);
      const inventories =
        await this.cartRepository.getInventoryByVariantIds(variantIds);
      const inventoryMap = new Map(
        inventories.map((inv) => [inv.variantId, inv]),
      );

      const items: CartItemResult[] = cart.items.map((item) => {
        const variant = item.variant;
        const product = variant?.product;
        const translation = product?.translations?.find(
          (t) => t.locale === locale,
        );
        const variantTranslation = variant?.translations?.find(
          (t) => t.locale === locale,
        );
        const inventory = inventoryMap.get(item.variantId) ?? null;
        const stockInfo = computeStockStatus(inventory);

        const price = variant?.price ?? '0.00';
        const lineTotal = computeLineTotal(price, item.quantity);

        const variantAttributes = variant?.plantAttributes
          ? {
              growthStage: variant.plantAttributes.growthStage ?? undefined,
              plantForm: variant.plantAttributes.plantForm ?? undefined,
              variegation: variant.plantAttributes.variegation ?? undefined,
              leafDensity: variant.plantAttributes.leafDensity ?? undefined,
              containerType: variant.plantAttributes.containerType ?? undefined,
              containerSize: variant.plantAttributes.containerSize ?? undefined,
            }
          : null;

        return {
          id: item.id,
          variantId: item.variantId,
          quantity: item.quantity,
          price,
          lineTotal,
          productName: translation?.name ?? 'Unknown Product',
          productSlug: product?.slug ?? '',
          productType: product?.productType ?? '',
          shopId: product?.shopId ?? '',
          thumbnail: product?.thumbnail
            ? { id: product.thumbnail.id, url: product.thumbnail.url }
            : null,
          stockStatus: stockInfo.stockStatus,
          availableQuantity: stockInfo.availableQuantity,
          maxQuantity: stockInfo.maxQuantity,
          variantAttributes,
          variantTitle: variantTranslation?.title ?? undefined,
          sku: variant?.sku ?? undefined,
        };
      });

      const { totalQuantity, subtotal } = computeCartTotals(items);

      return {
        id: cart.id,
        itemsCount: items.length,
        totalQuantity,
        subtotal,
        items,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get cart ${cartId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
