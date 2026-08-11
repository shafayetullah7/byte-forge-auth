import {
  assertBuyerCanCancelOrder,
  assertOrderTransition,
  assertSellerCanCancelOrder,
  getAllowedOrderTransitions,
} from './order-policy';
import { OrderDomainError } from './order.errors';
import { OrderStatus, isTerminalOrderStatus } from './order-status';

export interface OrderEntityProps {
  id: string;
  orderNumber: string;
  userId: string;
  shopId: string;
  groupId: string | null;
  status: OrderStatus;
  subtotal: string;
  shippingCost: string;
  tax: string;
  total: string;
  paymentStatus: string;
  paymentMethod: string | null;
  paymentMethodId: string | null;
  notes: string | null;
  cancelledAt: Date | null;
  cancelledReason: string | null;
  buyerDeliveryConfirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Order {
  readonly id: string;
  readonly orderNumber: string;
  readonly userId: string;
  readonly shopId: string;
  readonly groupId: string | null;
  status: OrderStatus;
  readonly subtotal: string;
  readonly shippingCost: string;
  readonly tax: string;
  readonly total: string;
  readonly paymentStatus: string;
  readonly paymentMethod: string | null;
  readonly paymentMethodId: string | null;
  readonly notes: string | null;
  cancelledAt: Date | null;
  cancelledReason: string | null;
  buyerDeliveryConfirmedAt: Date | null;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: OrderEntityProps) {
    this.id = props.id;
    this.orderNumber = props.orderNumber;
    this.userId = props.userId;
    this.shopId = props.shopId;
    this.groupId = props.groupId;
    this.status = props.status;
    this.subtotal = props.subtotal;
    this.shippingCost = props.shippingCost;
    this.tax = props.tax;
    this.total = props.total;
    this.paymentStatus = props.paymentStatus;
    this.paymentMethod = props.paymentMethod;
    this.paymentMethodId = props.paymentMethodId;
    this.notes = props.notes;
    this.cancelledAt = props.cancelledAt;
    this.cancelledReason = props.cancelledReason;
    this.buyerDeliveryConfirmedAt = props.buyerDeliveryConfirmedAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  isTerminal(): boolean {
    return isTerminalOrderStatus(this.status);
  }

  isCancelledOrExpired(): boolean {
    return (
      this.status === OrderStatus.CANCELLED ||
      this.status === OrderStatus.EXPIRED
    );
  }

  getAllowedTransitions(): readonly OrderStatus[] {
    return getAllowedOrderTransitions(this.status);
  }

  transitionTo(nextStatus: OrderStatus): void {
    assertOrderTransition(this.status, nextStatus);
    this.status = nextStatus;
    this.touch();
  }

  cancelByBuyer(reason?: string | null): void {
    if (this.isCancelledOrExpired()) {
      return;
    }
    assertBuyerCanCancelOrder(this.status);
    this.applyCancellation(reason);
  }

  cancelBySeller(reason?: string | null): void {
    if (this.isCancelledOrExpired()) {
      return;
    }
    assertSellerCanCancelOrder(this.status);
    this.applyCancellation(reason);
  }

  confirmDelivery(): void {
    if (this.status !== OrderStatus.SHIPPED) {
      throw new OrderDomainError(
        'Only shipped orders can be confirmed as delivered',
      );
    }
    this.transitionTo(OrderStatus.DELIVERED);
    this.buyerDeliveryConfirmedAt = new Date();
  }

  complete(): void {
    this.transitionTo(OrderStatus.COMPLETED);
  }

  private applyCancellation(reason?: string | null): void {
    assertOrderTransition(this.status, OrderStatus.CANCELLED);
    this.status = OrderStatus.CANCELLED;
    this.cancelledAt = new Date();
    this.cancelledReason = reason ?? null;
    this.touch();
  }

  private touch(): void {
    this.updatedAt = new Date();
  }
}
