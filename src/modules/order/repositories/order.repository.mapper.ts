import type {
  TNewOrder,
  TOrder,
  TNewOrderGroup,
  TOrderGroup,
} from '@/_db/drizzle/schema/order';
import { Order } from '../domain/order.entity';
import { OrderGroup } from '../domain/order-group.entity';

export function mapOrderRowToEntity(row: TOrder): Order {
  return new Order({
    id: row.id,
    orderNumber: row.orderNumber,
    userId: row.userId,
    shopId: row.shopId,
    groupId: row.groupId,
    status: row.status,
    subtotal: row.subtotal,
    shippingCost: row.shippingCost,
    tax: row.tax,
    total: row.total,
    paymentStatus: row.paymentStatus,
    paymentMethod: row.paymentMethod,
    paymentMethodId: row.paymentMethodId,
    notes: row.notes,
    cancelledAt: row.cancelledAt,
    cancelledReason: row.cancelledReason,
    buyerDeliveryConfirmedAt: row.buyerDeliveryConfirmedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function mapOrderEntityToRow(order: Order): TOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    userId: order.userId,
    shopId: order.shopId,
    groupId: order.groupId,
    status: order.status,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    tax: order.tax,
    total: order.total,
    paymentStatus: order.paymentStatus as TOrder['paymentStatus'],
    paymentMethod: order.paymentMethod as TOrder['paymentMethod'],
    paymentMethodId: order.paymentMethodId,
    notes: order.notes,
    cancelledAt: order.cancelledAt,
    cancelledReason: order.cancelledReason,
    buyerDeliveryConfirmedAt: order.buyerDeliveryConfirmedAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export function mapOrderEntityToUpdatePatch(order: Order): Partial<TNewOrder> {
  return {
    status: order.status,
    cancelledAt: order.cancelledAt,
    cancelledReason: order.cancelledReason,
    buyerDeliveryConfirmedAt: order.buyerDeliveryConfirmedAt,
    paymentStatus: order.paymentStatus as TOrder['paymentStatus'],
    updatedAt: order.updatedAt,
  };
}

export function mapOrderGroupRowToEntity(row: TOrderGroup): OrderGroup {
  return new OrderGroup({
    id: row.id,
    userId: row.userId,
    totalAmount: row.totalAmount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function mapOrderGroupEntityToUpdatePatch(
  group: OrderGroup,
): Partial<TNewOrderGroup> {
  return {
    totalAmount: group.totalAmount,
    updatedAt: group.updatedAt,
  };
}
