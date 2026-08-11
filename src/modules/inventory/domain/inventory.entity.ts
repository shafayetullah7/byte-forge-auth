import { InventoryDomainError } from './inventory.errors';

export interface InventoryEntityProps {
  id: string;
  variantId: string;
  shopId: string;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Inventory {
  readonly id: string;
  readonly variantId: string;
  readonly shopId: string;
  quantity: number;
  reservedQuantity: number;
  readonly lowStockThreshold: number;
  readonly trackInventory: boolean;
  readonly allowBackorder: boolean;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: InventoryEntityProps) {
    this.id = props.id;
    this.variantId = props.variantId;
    this.shopId = props.shopId;
    this.quantity = props.quantity;
    this.reservedQuantity = props.reservedQuantity;
    this.lowStockThreshold = props.lowStockThreshold;
    this.trackInventory = props.trackInventory;
    this.allowBackorder = props.allowBackorder;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  get availableQuantity(): number {
    return this.quantity - this.reservedQuantity;
  }

  assertCanReserve(quantity: number, productName?: string): void {
    if (!this.trackInventory) {
      return;
    }

    if (!this.allowBackorder && this.availableQuantity < quantity) {
      throw new InventoryDomainError(
        `Insufficient stock for ${productName ?? 'item'}. Available: ${this.availableQuantity}, Requested: ${quantity}`,
      );
    }
  }

  reserve(quantity: number): {
    previousQuantity: number;
    previousReserved: number;
    newReserved: number;
  } {
    const previousQuantity = this.quantity;
    const previousReserved = this.reservedQuantity;
    const newReserved = previousReserved + quantity;
    this.reservedQuantity = newReserved;
    this.touch();
    return { previousQuantity, previousReserved, newReserved };
  }

  releaseReservation(quantity: number): {
    previousQuantity: number;
    previousReserved: number;
    newReserved: number;
  } {
    const previousQuantity = this.quantity;
    const previousReserved = this.reservedQuantity;
    const newReserved = Math.max(0, previousReserved - quantity);
    this.reservedQuantity = newReserved;
    this.touch();
    return { previousQuantity, previousReserved, newReserved };
  }

  fulfill(quantity: number): {
    previousQuantity: number;
    previousReserved: number;
    newQuantity: number;
    newReserved: number;
  } {
    const previousQuantity = this.quantity;
    const previousReserved = this.reservedQuantity;
    const newQuantity = Math.max(0, previousQuantity - quantity);
    const newReserved = Math.max(0, previousReserved - quantity);
    this.quantity = newQuantity;
    this.reservedQuantity = newReserved;
    this.touch();
    return { previousQuantity, previousReserved, newQuantity, newReserved };
  }

  private touch(): void {
    this.updatedAt = new Date();
  }
}
