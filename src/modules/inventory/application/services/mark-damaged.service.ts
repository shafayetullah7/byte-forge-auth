import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { productVariantsTable, productsTable } from '@/_db/drizzle/schema';
import { InventoryMovementTypeEnum } from '@/_db/drizzle/enum';
import { InventoryRepository } from '@/modules/inventory/repositories/inventory.repository';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class MarkDamagedService {
  private readonly logger = new Logger(MarkDamagedService.name);

  constructor(
    private readonly db: DrizzleService,
    private readonly inventoryRepository: InventoryRepository,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    shopId: string,
    productId: string,
    userId: string,
    data: {
      variantId: string;
      quantity: number;
      reason?: string;
    },
    lang: string,
  ) {
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

    // Execute in transaction: get/create inventory, lock, validate, update, create movement
    return await this.db.transaction(async (tx) => {
      // Get or create inventory record with advisory lock
      const inventory = await this.inventoryRepository.getOrCreateInventory(
        variant.id,
        shopId,
        tx,
        variant.lowStockThreshold,
      );

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

      const previousQuantity = inventory.quantity;
      const previousReserved = inventory.reservedQuantity;
      const availableQuantity = previousQuantity - previousReserved;

      // Validate: cannot damage more than available stock
      if (data.quantity > availableQuantity) {
        throw new CustomException({
          message: this.i18n.t(
            'message.validation.inventory.damagedExceedsAvailable',
            {
              lang,
              args: { available: availableQuantity, requested: data.quantity },
            },
          ),
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: ErrorCode.VALIDATION_ERROR,
        });
      }

      const newQuantity = previousQuantity - data.quantity;
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
          movementType: InventoryMovementTypeEnum.DAMAGED,
          quantityChange: -data.quantity,
          previousQuantity,
          newQuantity,
          previousReserved,
          newReserved,
          referenceType: null,
          referenceId: null,
          reason: data.reason ?? null,
          createdBy: userId,
        },
        tx,
      );

      this.logger.log(
        `Marked ${data.quantity} units as damaged for variant ${variant.id}. ` +
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
