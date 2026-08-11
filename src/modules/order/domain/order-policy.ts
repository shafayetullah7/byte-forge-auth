import { OrderDomainError } from './order.errors';
import { OrderStatus } from './order-status';

/**
 * Status transition graph. Must stay in sync with legacy clients until all
 * order HTTP is on module controllers (Phase 10+).
 */
export const ORDER_STATUS_TRANSITIONS: Record<
  OrderStatus,
  readonly OrderStatus[]
> = {
  [OrderStatus.PENDING_PAYMENT]: [
    OrderStatus.PROCESSING,
    OrderStatus.CANCELLED,
    OrderStatus.EXPIRED,
  ],
  [OrderStatus.PROCESSING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.EXPIRED]: [],
};

export const BUYER_CANCELLABLE_STATUSES: readonly OrderStatus[] = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PROCESSING,
];

export const SELLER_CANCELLABLE_STATUSES: readonly OrderStatus[] = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PROCESSING,
  OrderStatus.CONFIRMED,
];

export function getAllowedOrderTransitions(
  from: OrderStatus,
): readonly OrderStatus[] {
  return ORDER_STATUS_TRANSITIONS[from] ?? [];
}

export function assertOrderTransition(
  from: OrderStatus,
  to: OrderStatus,
): void {
  const allowed = getAllowedOrderTransitions(from);
  if (!allowed.includes(to)) {
    throw new OrderDomainError(`Cannot transition order from ${from} to ${to}`);
  }
}

export function assertBuyerCanCancelOrder(status: OrderStatus): void {
  if (!BUYER_CANCELLABLE_STATUSES.includes(status)) {
    throw new OrderDomainError(
      `Order cannot be cancelled in ${status} status. Only orders in PENDING_PAYMENT or PROCESSING status can be cancelled.`,
    );
  }
}

export function assertSellerCanCancelOrder(status: OrderStatus): void {
  if (!SELLER_CANCELLABLE_STATUSES.includes(status)) {
    throw new OrderDomainError(
      `Order cannot be cancelled in ${status} status.`,
    );
  }
}

export function canBuyerCancelOrder(status: OrderStatus): boolean {
  return BUYER_CANCELLABLE_STATUSES.includes(status);
}

export function canSellerCancelOrder(status: OrderStatus): boolean {
  return SELLER_CANCELLABLE_STATUSES.includes(status);
}
