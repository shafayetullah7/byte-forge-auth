export interface OrderGroupEntityProps {
  id: string;
  userId: string;
  totalAmount: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Checkout aggregate root: one buyer checkout may create one group with many shop orders.
 */
export class OrderGroup {
  readonly id: string;
  readonly userId: string;
  totalAmount: string;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: OrderGroupEntityProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.totalAmount = props.totalAmount;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  setTotalAmount(totalAmount: string): void {
    this.totalAmount = totalAmount;
    this.updatedAt = new Date();
  }
}
