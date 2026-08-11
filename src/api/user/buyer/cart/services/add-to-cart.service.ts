import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { CartRepository } from '@/modules/cart/repositories';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { productVariantsTable, TInventory } from '@/_db/drizzle/schema';
import { ProductStatusEnum } from '@/_db/drizzle/enum';
import { CustomException } from '@/common/exceptions/custom.exception';
import { AddToCartDto } from '../dto/add-to-cart.dto';
import { computeStockStatus, computeLineTotal } from '../cart.utils';

export type AddToCartResult = {
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

@Injectable()
export class AddToCartService {
  private readonly logger = new Logger(AddToCartService.name);

  constructor(
    private readonly cartRepository: CartRepository,
    private readonly db: DrizzleService,
  ) {}

  async executeByCartId(
    cartId: string,
    dto: AddToCartDto,
    locale: string = 'en',
  ): Promise<AddToCartResult> {
    try {
      return await this.db.transaction(async (tx) => {
        const lockTx = { tx, lock: true };

        const variant =
          await this.db.client.query.productVariantsTable.findFirst({
            where: eq(productVariantsTable.id, dto.variantId),
            columns: {
              sku: true,
              price: true,
              isActive: true,
            },
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
                  thumbnail: {
                    columns: { id: true, url: true },
                  },
                  translations: {
                    columns: { locale: true, name: true },
                  },
                },
              },
              plantAttributes: {
                columns: {
                  growthStage: true,
                  plantForm: true,
                  variegation: true,
                  leafDensity: true,
                  containerType: true,
                  containerSize: true,
                },
              },
              translations: {
                columns: { locale: true, title: true },
              },
            },
          });

        if (!variant) {
          throw CustomException.notFound({
            message: 'Product variant not found',
            details: `Variant ID: ${dto.variantId}`,
          });
        }

        if (!variant.isActive) {
          throw CustomException.badRequest({
            message: 'This product variant is not available',
            details: 'The variant has been deactivated',
          });
        }

        if (
          !variant.product ||
          variant.product.status !== ProductStatusEnum.ACTIVE
        ) {
          throw CustomException.badRequest({
            message: 'This product is not available for purchase',
            details: `Product status: ${variant.product?.status ?? 'not found'}`,
          });
        }

        const inventory =
          (await this.cartRepository.getInventoryByVariantIdLocked(
            dto.variantId,
            lockTx,
          )) ?? null;

        if (inventory) {
          if (!inventory.trackInventory) {
            // Inventory tracking disabled, allow any quantity
          } else {
            const availableQuantity =
              inventory.quantity - inventory.reservedQuantity;
            if (availableQuantity < dto.quantity) {
              throw CustomException.badRequest({
                message: 'Insufficient stock',
                details: `Only ${availableQuantity} items available. Requested: ${dto.quantity}`,
              });
            }
          }
        }

        const existingItem = await this.cartRepository.getCartItem(
          cartId,
          dto.variantId,
          lockTx,
        );

        if (existingItem) {
          const newQuantity = existingItem.quantity + dto.quantity;

          if (inventory?.trackInventory) {
            const availableQuantity =
              inventory.quantity - inventory.reservedQuantity;
            if (availableQuantity < newQuantity) {
              throw CustomException.badRequest({
                message: 'Insufficient stock for updated quantity',
                details: `Only ${availableQuantity} items available. Current in cart: ${existingItem.quantity}, adding: ${dto.quantity}`,
              });
            }
          }

          const updatedItem = await this.cartRepository.updateCartItem(
            existingItem.id,
            { quantity: newQuantity },
            lockTx,
          );

          return this.mapCartItem(updatedItem, variant, inventory, locale);
        }

        const newItem = await this.cartRepository.createCartItem(
          {
            cartId,
            variantId: dto.variantId,
            quantity: dto.quantity,
          },
          { tx },
        );

        return this.mapCartItem(newItem, variant, inventory, locale);
      });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      this.logger.error(
        `Failed to add item to cart ${cartId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
  private mapCartItem(
    item: { id: string; variantId: string; quantity: number },
    variant: any,
    inventory: TInventory | null,
    locale: string,
  ): AddToCartResult {
    const translation = variant.product?.translations?.find(
      (t: { locale: string }) => t.locale === locale,
    );
    const variantTranslation = variant.translations?.find(
      (t: { locale: string }) => t.locale === locale,
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
      productSlug: variant.product?.slug ?? '',
      productType: variant.product?.productType ?? '',
      shopId: variant.product?.shopId ?? '',
      thumbnail: variant.product?.thumbnail
        ? {
            id: variant.product.thumbnail.id,
            url: variant.product.thumbnail.url,
          }
        : null,
      stockStatus: stockInfo.stockStatus,
      availableQuantity: stockInfo.availableQuantity,
      maxQuantity: stockInfo.maxQuantity,
      variantAttributes,
      variantTitle: variantTranslation?.title ?? undefined,
      sku: variant.sku ?? undefined,
    };
  }
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
}
