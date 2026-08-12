import { ProductStatusEnum } from '@/_db/drizzle/enum';
import type { TInventory } from '@/_db/drizzle/schema';
import { CustomException } from '@/libs/exceptions/custom.exception';
import type { CartVariantForOperation } from '../repositories/cart.repository.types';

export function assertVariantExists(
  variant: CartVariantForOperation | null | undefined,
  variantId?: string,
): asserts variant is CartVariantForOperation {
  if (!variant) {
    throw CustomException.notFound({
      message: 'Product variant not found',
      details: variantId ? `Variant ID: ${variantId}` : undefined,
    });
  }
}

export function assertVariantAvailableForPurchase(
  variant: CartVariantForOperation,
): void {
  if (!variant.isActive) {
    throw CustomException.badRequest({
      message: 'This product variant is not available',
      details: 'The variant has been deactivated',
    });
  }

  if (!variant.product || variant.product.status !== ProductStatusEnum.ACTIVE) {
    throw CustomException.badRequest({
      message: 'This product is not available for purchase',
      details: `Product status: ${variant.product?.status ?? 'not found'}`,
    });
  }
}

export function assertSufficientStock(
  inventory: TInventory | null,
  quantity: number,
  options?: { message?: string; details?: string },
): void {
  if (!inventory?.trackInventory) {
    return;
  }

  const availableQuantity = inventory.quantity - inventory.reservedQuantity;
  if (availableQuantity < quantity) {
    throw CustomException.badRequest({
      message: options?.message ?? 'Insufficient stock',
      details:
        options?.details ??
        `Only ${availableQuantity} items available. Requested: ${quantity}`,
    });
  }
}

export function getAvailableQuantity(
  inventory: TInventory | null,
): number | null {
  if (!inventory?.trackInventory) {
    return null;
  }
  return inventory.quantity - inventory.reservedQuantity;
}
