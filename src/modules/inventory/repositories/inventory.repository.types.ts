import { InventoryMovementTypeEnum } from '@/_db/drizzle/enum';

export interface MovementFilterParams {
  variantId?: string;
  movementType?: InventoryMovementTypeEnum;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedMovementsResult {
  movements: import('@/_db/drizzle/schema/inventory').TInventoryMovement[];
  total: number;
  page: number;
  limit: number;
}

export type {
  TInventory,
  TNewInventory,
  TInventoryMovement,
  TNewInventoryMovement,
} from '@/_db/drizzle/schema/inventory';
