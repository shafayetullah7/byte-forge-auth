import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { CartRepository } from '@/modules/cart/repositories';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { productVariantsTable } from '@/_db/drizzle/schema';
import { ProductStatusEnum } from '@/_db/drizzle/enum';
import { MergeCartDto } from '../dto/merge-cart.dto';
import { computeStockStatus, computeLineTotal } from '../cart.utils';
import { CartResult } from './get-cart.service';

export type MergeCartResult = {
  mergedCount: number;
  failedItems: { variantId: string; reason: string }[];
  cart: CartResult;
};

@Injectable()
export class MergeCartService {
  private readonly logger = new Logger(MergeCartService.name);

  constructor(
    private readonly cartRepository: CartRepository,
    private readonly db: DrizzleService,
  ) {}

  async executeByCartId(
    cartId: string,
    dto: MergeCartDto,
    locale: string = 'en',
  ): Promise<MergeCartResult> {
    try {
      return await this.db.transaction(async (tx) => {
        const lockTx = { tx, lock: true };
        const cart = await this.cartRepository.getCartWithItemsById(cartId);

        if (!cart) {
          throw new Error('Cart not found');
        }

        const failedItems: { variantId: string; reason: string }[] = [];

        for (const guestItem of dto.guestItems) {
          try {
            const variant =
              await this.db.client.query.productVariantsTable.findFirst({
                where: eq(productVariantsTable.id, guestItem.variantId),
                with: {
                  product: {
                    columns: {
                      id: true,
                      slug: true,
                      productType: true,
                      status: true,
                      shopId: true,
                      thumbnailId: true,
                    },
                    with: {
                      thumbnail: { columns: { id: true, url: true } },
                      translations: { columns: { locale: true, name: true } },
                    },
                  },
                },
              });

            if (!variant) {
              failedItems.push({
                variantId: guestItem.variantId,
                reason: 'Product variant not found',
              });
              continue;
            }

            if (!variant.isActive) {
              failedItems.push({
                variantId: guestItem.variantId,
                reason: 'Product variant is not available',
              });
              continue;
            }

            if (
              !variant.product ||
              variant.product.status !== ProductStatusEnum.ACTIVE
            ) {
              failedItems.push({
                variantId: guestItem.variantId,
                reason: 'Product is not available for purchase',
              });
              continue;
            }

            const inventory =
              (await this.cartRepository.getInventoryByVariantIdLocked(
                guestItem.variantId,
                lockTx,
              )) ?? null;

            const existingItem = await this.cartRepository.getCartItem(
              cart.id,
              guestItem.variantId,
              lockTx,
            );

            if (inventory?.trackInventory) {
              const availableQuantity =
                inventory.quantity - inventory.reservedQuantity;
              const currentQuantity = existingItem?.quantity ?? 0;
              if (availableQuantity < currentQuantity + guestItem.quantity) {
                failedItems.push({
                  variantId: guestItem.variantId,
                  reason: `Insufficient stock. Only ${availableQuantity} available`,
                });
                continue;
              }
            }

            if (existingItem) {
              await this.cartRepository.updateCartItem(
                existingItem.id,
                { quantity: existingItem.quantity + guestItem.quantity },
                lockTx,
              );
            } else {
              await this.cartRepository.createCartItem(
                {
                  cartId: cart.id,
                  variantId: guestItem.variantId,
                  quantity: guestItem.quantity,
                },
                { tx },
              );
            }
          } catch {
            failedItems.push({
              variantId: guestItem.variantId,
              reason: 'Failed to merge item',
            });
          }
        }

        const updatedCart =
          await this.cartRepository.getCartWithItemsById(cartId);
        if (!updatedCart) {
          throw new Error('Failed to retrieve cart after merge');
        }

        const variantIds = updatedCart.items.map((item) => item.variantId);
        const inventories =
          await this.cartRepository.getInventoryByVariantIds(variantIds);
        const inventoryMap = new Map(
          inventories.map((inv) => [inv.variantId, inv]),
        );

        const items = updatedCart.items.map((item) => {
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

          const variantAttributes = variant?.plantAttributes
            ? {
                growthStage: variant.plantAttributes.growthStage ?? undefined,
                plantForm: variant.plantAttributes.plantForm ?? undefined,
                variegation: variant.plantAttributes.variegation ?? undefined,
                leafDensity: variant.plantAttributes.leafDensity ?? undefined,
                containerType:
                  variant.plantAttributes.containerType ?? undefined,
                containerSize:
                  variant.plantAttributes.containerSize ?? undefined,
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
            sku: variant?.sku ?? undefined,
          };
        });

        const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
        const subtotal = items.reduce(
          (sum, i) => sum + parseFloat(i.price) * i.quantity,
          0,
        );

        return {
          mergedCount: dto.guestItems.length - failedItems.length,
          failedItems,
          cart: {
            id: updatedCart.id,
            itemsCount: items.length,
            totalQuantity,
            subtotal: subtotal.toFixed(2),
            items,
            createdAt: updatedCart.createdAt,
            updatedAt: updatedCart.updatedAt,
          },
        };
      });
    } catch (error) {
      this.logger.error(
        `Failed to merge cart ${cartId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
