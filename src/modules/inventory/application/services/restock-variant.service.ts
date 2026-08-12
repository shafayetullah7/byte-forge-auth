import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { productVariantsTable, productsTable } from '@/_db/drizzle/schema';
import { InventoryMovementTypeEnum } from '@/_db/drizzle/enum';
import { InventoryRepository } from '@/modules/inventory/repositories/inventory.repository';
import { SyncVariantProjectionService } from '@/modules/inventory/application/services/sync-variant-projection.service';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';
import { I18nService } from 'nestjs-i18n';

const MAX_INT32 = 2147483647;

@Injectable()
export class RestockVariantService {
  private readonly logger = new Logger(RestockVariantService.name);

  constructor(
    private readonly db: DrizzleService,
    private readonly inventoryRepository: InventoryRepository,
    private readonly syncVariantProjection: SyncVariantProjectionService,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    shopId: string,
    productId: string,
    userId: string,
    data: {
      variantId: string;
      quantity: number;
      referenceType?: string;
      referenceId?: string;
      reason?: string;
    },
    lang: string,
  ) {
    if (data.quantity <= 0) {
      throw new CustomException({
        message: this.i18n.t('message.validation.inventory.invalidQuantity', {
          lang,
        }),
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.VALIDATION_ERROR,
      });
    }

    // Verify product belongs to shop and variant belongs to product
    const [variantRecord] = await this.db.client
      .select({
        variantId: productVariantsTable.id,
        variantSku: productVariantsTable.sku,
        productId: productsTable.id,
        shopId: productsTable.shopId,
        lowStockThreshold: productVariantsTable.lowStockThreshold,
      })
      .from(productVariantsTable)
      .innerJoin(
        productsTable,
        eq(productVariantsTable.productId, productsTable.id),
      )
      .where(
        and(
          eq(productsTable.shopId, shopId),
          eq(productsTable.id, productId),
          eq(productVariantsTable.id, data.variantId),
        ),
      )
      .limit(1)
      .execute();

    if (!variantRecord) {
      throw new CustomException({
        message: this.i18n.t('message.error.variantNotFound', { lang }),
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: ErrorCode.NOT_FOUND,
      });
    }

    const variant = {
      id: variantRecord.variantId,
      sku: variantRecord.variantSku,
      lowStockThreshold: variantRecord.lowStockThreshold ?? 5,
    };

    // Execute in transaction: get/create inventory, lock, update, create movement
    return await this.db.transaction(async (tx) => {
      // Get or create inventory record with advisory lock
      const inventory = await this.inventoryRepository.getOrCreateInventory(
        variant.id,
        shopId,
        tx,
        variant.lowStockThreshold,
      );

      // Check if inventory tracking is enabled
      if (!inventory.trackInventory) {
        throw new CustomException({
          message: this.i18n.t(
            'message.validation.inventory.trackingDisabled',
            { lang },
          ),
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: ErrorCode.VALIDATION_ERROR,
        });
      }

      // Check integer overflow before computing
      const previousQuantity = inventory.quantity;
      const previousReserved = inventory.reservedQuantity;
      const newQuantity = previousQuantity + data.quantity;

      if (newQuantity > MAX_INT32) {
        throw new CustomException({
          message: this.i18n.t('message.validation.inventory.stockOverflow', {
            lang,
          }),
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: ErrorCode.VALIDATION_ERROR,
        });
      }

      const newReserved = previousReserved;

      // Update inventory
      const updated = await this.inventoryRepository.update(
        inventory.id,
        { quantity: newQuantity },
        tx,
      );

      // Create movement record
      const movement = await this.inventoryRepository.createMovement(
        {
          inventoryId: inventory.id,
          shopId,
          movementType: InventoryMovementTypeEnum.RESTOCK,
          quantityChange: data.quantity,
          previousQuantity,
          newQuantity,
          previousReserved,
          newReserved,
          referenceType: data.referenceType ?? null,
          referenceId: data.referenceId ?? null,
          reason: data.reason ?? null,
          createdBy: userId,
        },
        tx,
      );

      await this.syncVariantProjection.syncFromInventory(variant.id, updated, tx);

      this.logger.log(
        `Restocked variant ${variant.id} by ${data.quantity} units. ` +
          `Quantity: ${previousQuantity} -> ${newQuantity}`,
      );

      return {
        movement: this.mapMovement(movement, variant),
        newQuantity: updated.quantity,
        newReserved: updated.reservedQuantity,
      };
    });
  }

  private mapMovement(
    movement: {
      id: string;
      inventoryId: string;
      movementType: string;
      quantityChange: number;
      previousQuantity: number;
      newQuantity: number;
      previousReserved: number;
      newReserved: number;
      referenceType: string | null;
      referenceId: string | null;
      reason: string | null;
      createdBy: string | null;
      createdAt: Date;
    },
    variant: { id: string; sku: string | null },
  ) {
    return {
      id: movement.id,
      inventoryId: movement.inventoryId,
      variantId: variant.id,
      variantSku: variant.sku,
      variantName: null,
      movementType: movement.movementType,
      quantityChange: movement.quantityChange,
      previousQuantity: movement.previousQuantity,
      newQuantity: movement.newQuantity,
      previousReserved: movement.previousReserved,
      newReserved: movement.newReserved,
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
      reason: movement.reason,
      createdBy: movement.createdBy,
      createdAt: movement.createdAt,
    };
  }
}
