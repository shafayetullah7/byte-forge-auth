import type { TInventory } from '@/_db/drizzle/schema';
import { computeLineTotal, computeStockStatus } from '@/libs/cart/stock.util';
import { computeCartTotals } from '@/libs/cart/totals.util';
import type { CartRepository } from '../repositories/cart.repository';
import type { CartVariantForOperation } from '../repositories/cart.repository.types';
import type {
  CartItemResult,
  CartResult,
} from '../application/queries/get-cart.query.types';

type CartWithItems = NonNullable<
  Awaited<ReturnType<CartRepository['getCartWithItemsById']>>
>;

type CartLineItem = CartWithItems['items'][number];

export function mapVariantRowToCartItemResult(
  item: { id: string; variantId: string; quantity: number },
  variant: CartVariantForOperation,
  inventory: TInventory | null,
  locale: string,
): CartItemResult {
  const product = variant.product;
  const translation = product?.translations?.find((t) => t.locale === locale);
  const variantTranslation = variant.translations?.find(
    (t) => t.locale === locale,
  );
  const price = variant.price ?? '0.00';
  const stockInfo = computeStockStatus(inventory);

  const variantAttributes = variant.plantAttributes
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
    lineTotal: computeLineTotal(price, item.quantity),
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
    sku: variant.sku ?? undefined,
  };
}

export function mapCartItemToResult(
  item: CartLineItem,
  locale: string,
  inventory: TInventory | null,
): CartItemResult {
  const variant = item.variant;
  const product = variant?.product;
  const translation = product?.translations?.find((t) => t.locale === locale);
  const variantTranslation = variant?.translations?.find(
    (t) => t.locale === locale,
  );
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
}

export function mapCartWithItemsToResult(
  cart: CartWithItems,
  locale: string,
  inventories: TInventory[],
): CartResult {
  const inventoryMap = new Map(inventories.map((inv) => [inv.variantId, inv]));
  const items = cart.items.map((item) =>
    mapCartItemToResult(item, locale, inventoryMap.get(item.variantId) ?? null),
  );
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
}
