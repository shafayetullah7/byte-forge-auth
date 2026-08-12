import { BadRequestException, Injectable } from '@nestjs/common';
import { InventoryMovementTypeEnum } from '@/_db/drizzle/enum/inventory-movement-type.enum';
import type { DrizzleTx } from '@/libs/db/types';
import { InventoryDomainError } from '../../domain/inventory.errors';
import type { Inventory } from '../../domain/inventory.entity';
import {
  mapInventoryEntityToRow,
  mapInventoryEntityToUpdatePatch,
  mapInventoryRowToEntity,
} from '../../repositories/inventory.repository.mapper';
import { InventoryRepository } from '../../repositories/inventory.repository';
import { SyncVariantProjectionService } from '../services/sync-variant-projection.service';
import type { OrderInventoryItem } from './inventory.command.types';

/**
 * Public command API for inventory mutations invoked from other modules (e.g. Order checkout).
 * All order-coupled methods require an active transaction (`tx`).
 */
@Injectable()
export class InventoryCommandService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly syncVariantProjection: SyncVariantProjectionService,
  ) {}

  async reserveForOrder(
    items: OrderInventoryItem[],
    orderId: string,
    userId: string,
    tx: DrizzleTx,
  ): Promise<void> {
    for (const item of items) {
      const row = await this.inventoryRepository.getOrCreateInventory(
        item.variantId,
        item.shopId,
        tx,
      );
      const inventory = mapInventoryRowToEntity(row);

      try {
        inventory.assertCanReserve(item.quantity, item.productName);
      } catch (error) {
        if (error instanceof InventoryDomainError) {
          throw new BadRequestException(error.message);
        }
        throw error;
      }

      if (!inventory.trackInventory) {
        continue;
      }

      const { previousQuantity, previousReserved, newReserved } =
        inventory.reserve(item.quantity);

      await this.inventoryRepository.update(
        inventory.id,
        mapInventoryEntityToUpdatePatch(inventory),
        tx,
      );

      await this.inventoryRepository.createMovement(
        {
          inventoryId: inventory.id,
          shopId: item.shopId,
          movementType: InventoryMovementTypeEnum.ORDER_RESERVED,
          quantityChange: 0,
          previousQuantity,
          newQuantity: previousQuantity,
          previousReserved,
          newReserved,
          referenceType: 'order',
          referenceId: orderId,
          createdBy: userId,
        },
        tx,
      );

      await this.syncProjection(item.variantId, inventory, tx);
    }
  }

  async releaseOrderReservation(
    items: OrderInventoryItem[],
    orderId: string,
    userId: string,
    tx: DrizzleTx,
  ): Promise<void> {
    for (const item of items) {
      const row = await this.inventoryRepository.findByVariantId(
        item.variantId,
      );

      if (!row?.trackInventory) {
        continue;
      }

      const inventory = mapInventoryRowToEntity(row);
      const { previousQuantity, previousReserved, newReserved } =
        inventory.releaseReservation(item.quantity);

      await this.inventoryRepository.update(
        inventory.id,
        mapInventoryEntityToUpdatePatch(inventory),
        tx,
      );

      await this.inventoryRepository.createMovement(
        {
          inventoryId: inventory.id,
          shopId: item.shopId,
          movementType: InventoryMovementTypeEnum.ORDER_CANCELLED,
          quantityChange: 0,
          previousQuantity,
          newQuantity: previousQuantity,
          previousReserved,
          newReserved,
          referenceType: 'order',
          referenceId: orderId,
          reason: 'Order cancelled',
          createdBy: userId,
        },
        tx,
      );

      await this.syncProjection(item.variantId, inventory, tx);
    }
  }

  async fulfillOrder(
    items: OrderInventoryItem[],
    orderId: string,
    userId: string,
    tx: DrizzleTx,
  ): Promise<void> {
    for (const item of items) {
      const row = await this.inventoryRepository.getOrCreateInventory(
        item.variantId,
        item.shopId,
        tx,
      );
      const inventory = mapInventoryRowToEntity(row);

      if (!inventory.trackInventory) {
        continue;
      }

      const { previousQuantity, previousReserved, newQuantity, newReserved } =
        inventory.fulfill(item.quantity);

      await this.inventoryRepository.update(
        inventory.id,
        mapInventoryEntityToUpdatePatch(inventory),
        tx,
      );

      await this.inventoryRepository.createMovement(
        {
          inventoryId: inventory.id,
          shopId: item.shopId,
          movementType: InventoryMovementTypeEnum.ORDER_FULFILLED,
          quantityChange: -item.quantity,
          previousQuantity,
          newQuantity,
          previousReserved,
          newReserved,
          referenceType: 'order',
          referenceId: orderId,
          reason: 'Order shipped',
          createdBy: userId,
        },
        tx,
      );

      await this.syncProjection(item.variantId, inventory, tx);
    }
  }

  private async syncProjection(
    variantId: string,
    inventory: Inventory,
    tx: DrizzleTx,
  ): Promise<void> {
    await this.syncVariantProjection.syncFromInventory(
      variantId,
      mapInventoryEntityToRow(inventory),
      tx,
    );
  }
}
