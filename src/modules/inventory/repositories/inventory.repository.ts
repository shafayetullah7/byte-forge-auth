import { eq, and, desc, gte, lte, count, sql } from 'drizzle-orm';

import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  inventoryTable,
  inventoryMovementsTable,
  TInventory,
  TNewInventory,
  TInventoryMovement,
  TNewInventoryMovement,
} from '@/_db/drizzle/schema/inventory';
import type { DrizzleTx } from '@/libs/db/types';
import { Injectable, Logger } from '@nestjs/common';
import type {
  MovementFilterParams,
  PaginatedMovementsResult,
} from './inventory.repository.types';

export type {
  MovementFilterParams,
  PaginatedMovementsResult,
} from './inventory.repository.types';

@Injectable()
export class InventoryRepository {
  private readonly logger = new Logger(InventoryRepository.name);

  constructor(private readonly db: DrizzleService) {}

  /**
   * Acquire advisory lock for a variant
   * Uses variantId converted to bigint for the lock
   */
  async acquireAdvisoryLock(variantId: string, tx: DrizzleTx): Promise<void> {
    // Convert UUID to a bigint hash for advisory lock
    const hash = this.uuidToHash(variantId);
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${hash})`);
  }

  /**
   * Get or create inventory for a variant within a transaction
   * Uses advisory lock to prevent race conditions
   */
  async getOrCreateInventory(
    variantId: string,
    shopId: string,
    tx: DrizzleTx,
    lowStockThreshold: number = 5,
  ): Promise<TInventory> {
    // Acquire advisory lock for this variant
    await this.acquireAdvisoryLock(variantId, tx);

    // Check if inventory exists
    const [existing] = await tx
      .select()
      .from(inventoryTable)
      .where(eq(inventoryTable.variantId, variantId))
      .execute();

    if (existing) {
      return existing;
    }

    // Create new inventory record
    const [created] = await tx
      .insert(inventoryTable)
      .values({
        variantId,
        shopId,
        quantity: 0,
        reservedQuantity: 0,
        lowStockThreshold,
        trackInventory: true,
        allowBackorder: false,
      })
      .returning()
      .execute();

    this.logger.log(`Created new inventory record for variant ${variantId}`);
    return created;
  }

  async findByVariantId(variantId: string): Promise<TInventory | undefined> {
    const [inventory] = await this.db.client
      .select()
      .from(inventoryTable)
      .where(eq(inventoryTable.variantId, variantId))
      .execute();
    return inventory;
  }

  async findByVariantIdForUpdate(
    variantId: string,
  ): Promise<TInventory | undefined> {
    const [inventory] = await this.db.client
      .select()
      .from(inventoryTable)
      .where(eq(inventoryTable.variantId, variantId))
      .for('update')
      .execute();
    return inventory;
  }

  async findByShopId(shopId: string): Promise<TInventory[]> {
    return await this.db.client
      .select()
      .from(inventoryTable)
      .where(eq(inventoryTable.shopId, shopId))
      .execute();
  }

  async createInventory(
    payload: TNewInventory,
    tx?: DrizzleTx,
  ): Promise<TInventory> {
    const executor = this.db.getExecutor(tx);
    const [created] = await executor
      .insert(inventoryTable)
      .values(payload)
      .returning()
      .execute();
    return created;
  }

  async update(
    inventoryId: string,
    data: Partial<Pick<TNewInventory, 'quantity' | 'reservedQuantity'>>,
    tx?: DrizzleTx,
  ): Promise<TInventory> {
    const executor = this.db.getExecutor(tx);
    const [updated] = await executor
      .update(inventoryTable)
      .set(data)
      .where(eq(inventoryTable.id, inventoryId))
      .returning()
      .execute();
    return updated;
  }

  async createMovement(
    payload: TNewInventoryMovement,
    tx?: DrizzleTx,
  ): Promise<TInventoryMovement> {
    const executor = this.db.getExecutor(tx);
    const [created] = await executor
      .insert(inventoryMovementsTable)
      .values(payload)
      .returning()
      .execute();
    return created;
  }

  async findMovements(
    inventoryId: string,
    filters: MovementFilterParams,
    page: number,
    limit: number,
  ): Promise<PaginatedMovementsResult> {
    const conditions = [eq(inventoryMovementsTable.inventoryId, inventoryId)];

    if (filters.movementType) {
      conditions.push(
        eq(inventoryMovementsTable.movementType, filters.movementType),
      );
    }

    if (filters.startDate) {
      conditions.push(
        gte(inventoryMovementsTable.createdAt, new Date(filters.startDate)),
      );
    }

    if (filters.endDate) {
      conditions.push(
        lte(inventoryMovementsTable.createdAt, new Date(filters.endDate)),
      );
    }

    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0];

    const [totalResult] = await this.db.client
      .select({ total: count() })
      .from(inventoryMovementsTable)
      .where(whereClause)
      .execute();

    const movements = await this.db.client
      .select()
      .from(inventoryMovementsTable)
      .where(whereClause)
      .orderBy(desc(inventoryMovementsTable.createdAt))
      .limit(limit)
      .offset((page - 1) * limit)
      .execute();

    return {
      movements,
      total: Number(totalResult.total),
      page,
      limit,
    };
  }

  async findMovementsByVariantId(
    variantId: string,
    filters: MovementFilterParams,
    page: number,
    limit: number,
  ): Promise<PaginatedMovementsResult> {
    const inventory = await this.findByVariantId(variantId);
    if (!inventory) {
      return { movements: [], total: 0, page, limit };
    }

    return this.findMovements(inventory.id, filters, page, limit);
  }

  /**
   * Convert UUID to a bigint hash for advisory lock
   * Uses a simple hash function to convert UUID string to bigint
   */
  private uuidToHash(uuid: string): number {
    // Simple hash function for UUID
    let hash = 0;
    for (let i = 0; i < uuid.length; i++) {
      const char = uuid.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Ensure positive number
    return Math.abs(hash);
  }
}
