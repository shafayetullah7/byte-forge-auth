import { OrderStatusEnum } from '@/_db/drizzle/enum/order-status.enum';
import type { OrderStatusChangedEvent } from '@/common/modules/events/events';

export type OrderEmailRecipient = 'buyer' | 'seller';

export function resolveOrderEmailRecipient(
  payload: OrderStatusChangedEvent['payload'],
): OrderEmailRecipient | null {
  const { toStatus, changedByUserId, buyerUserId } = payload;

  if (toStatus === OrderStatusEnum.CANCELLED) {
    return changedByUserId === buyerUserId ? 'seller' : 'buyer';
  }

  if (
    toStatus === OrderStatusEnum.DELIVERED &&
    changedByUserId === buyerUserId
  ) {
    return 'seller';
  }

  if (
    toStatus === OrderStatusEnum.PROCESSING ||
    toStatus === OrderStatusEnum.CONFIRMED ||
    toStatus === OrderStatusEnum.SHIPPED ||
    toStatus === OrderStatusEnum.DELIVERED ||
    toStatus === OrderStatusEnum.COMPLETED
  ) {
    return 'buyer';
  }

  return null;
}

export function resolveOrderEmailTemplateKey(
  payload: OrderStatusChangedEvent['payload'],
): string | null {
  const { toStatus, changedByUserId, buyerUserId } = payload;

  if (toStatus === OrderStatusEnum.CANCELLED) {
    return changedByUserId === buyerUserId
      ? 'orderCancelledByBuyer'
      : 'orderCancelledBySeller';
  }

  if (toStatus === OrderStatusEnum.PROCESSING) return 'orderAccepted';
  if (toStatus === OrderStatusEnum.CONFIRMED) return 'orderPacked';
  if (toStatus === OrderStatusEnum.SHIPPED) return 'orderShipped';
  if (toStatus === OrderStatusEnum.DELIVERED) {
    return changedByUserId === buyerUserId
      ? 'orderDeliveryConfirmedSeller'
      : 'orderDelivered';
  }
  if (toStatus === OrderStatusEnum.COMPLETED) return 'orderCompleted';

  return null;
}
