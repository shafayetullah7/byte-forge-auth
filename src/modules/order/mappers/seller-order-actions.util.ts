import {
  OrderStatusEnum,
  TOrderStatus,
} from '@/_db/drizzle/enum/order-status.enum';
import { PaymentMethodEnum } from '@/_db/drizzle/enum/payment-method.enum';
import {
  ShopStatusEnum,
  TShopStatus,
} from '@/_db/drizzle/enum/shop.status.enum';
import type { TShipment } from '@/_db/drizzle/schema';
import { getAllowedOrderTransitions } from '../domain/order-policy';

export type SellerOrderActionKey =
  | 'ACCEPT'
  | 'REJECT'
  | 'MARK_PACKED'
  | 'SHIP'
  | 'MARK_DELIVERED'
  | 'CONFIRM_PAYMENT'
  | 'CANCEL';

export interface SellerOrderActionDescriptor {
  key: SellerOrderActionKey;
  method: 'PATCH' | 'POST';
  endpoint: 'status' | 'ship' | 'cancel';
  targetStatus?: TOrderStatus;
  requiresConfirmation: boolean;
  requiresForm: boolean;
  primary: boolean;
  disabled: boolean;
  disabledReason: string | null;
}

const TERMINAL_STATUSES: readonly TOrderStatus[] = [
  OrderStatusEnum.COMPLETED,
  OrderStatusEnum.CANCELLED,
  OrderStatusEnum.EXPIRED,
];

export function isSellerOrderReadOnly(status: TOrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function buildSellerPaymentContext(
  paymentMethod: string | null,
  status: TOrderStatus,
) {
  const isCod = paymentMethod === PaymentMethodEnum.COD;
  return {
    collectOnDelivery: isCod,
    completesOnDeliver: false,
    requiresPaymentConfirmation: isCod && status === OrderStatusEnum.DELIVERED,
  };
}

export function buildSellerActionDescriptors(params: {
  status: TOrderStatus;
  paymentMethod: string | null;
  shipment: TShipment | null;
  shopStatus: TShopStatus;
  subscriptionFulfillmentAllowed?: boolean;
}): SellerOrderActionDescriptor[] {
  if (isSellerOrderReadOnly(params.status)) {
    return [];
  }

  const shopInactive = params.shopStatus !== ShopStatusEnum.ACTIVE;
  const shopDisabledReason = shopInactive
    ? 'Shop must be active to perform this action'
    : null;
  const subscriptionBlocked = params.subscriptionFulfillmentAllowed === false;
  const subscriptionDisabledReason = subscriptionBlocked
    ? 'Renew your platform subscription to fulfill orders'
    : null;

  const transitions = getAllowedOrderTransitions(params.status);
  const descriptors: SellerOrderActionDescriptor[] = [];

  const push = (
    descriptor: Omit<
      SellerOrderActionDescriptor,
      'disabled' | 'disabledReason'
    >,
  ) => {
    const isCancelAction =
      descriptor.key === 'CANCEL' || descriptor.key === 'REJECT';
    const blockedBySubscription = subscriptionBlocked && !isCancelAction;

    descriptors.push({
      ...descriptor,
      disabled: shopInactive || blockedBySubscription,
      disabledReason: shopInactive
        ? shopDisabledReason
        : blockedBySubscription
          ? subscriptionDisabledReason
          : null,
    });
  };

  if (
    params.status === OrderStatusEnum.PENDING_PAYMENT &&
    transitions.includes(OrderStatusEnum.PROCESSING)
  ) {
    push({
      key: 'ACCEPT',
      method: 'PATCH',
      endpoint: 'status',
      targetStatus: OrderStatusEnum.PROCESSING,
      requiresConfirmation: false,
      requiresForm: false,
      primary: true,
    });
    push({
      key: 'REJECT',
      method: 'PATCH',
      endpoint: 'cancel',
      requiresConfirmation: true,
      requiresForm: true,
      primary: false,
    });
  }

  if (
    params.status === OrderStatusEnum.PROCESSING &&
    transitions.includes(OrderStatusEnum.CONFIRMED)
  ) {
    push({
      key: 'MARK_PACKED',
      method: 'PATCH',
      endpoint: 'status',
      targetStatus: OrderStatusEnum.CONFIRMED,
      requiresConfirmation: false,
      requiresForm: false,
      primary: true,
    });
    push({
      key: 'CANCEL',
      method: 'PATCH',
      endpoint: 'cancel',
      requiresConfirmation: true,
      requiresForm: true,
      primary: false,
    });
  }

  if (
    params.status === OrderStatusEnum.CONFIRMED &&
    transitions.includes(OrderStatusEnum.SHIPPED) &&
    !params.shipment
  ) {
    push({
      key: 'SHIP',
      method: 'POST',
      endpoint: 'ship',
      requiresConfirmation: false,
      requiresForm: true,
      primary: true,
    });
    push({
      key: 'CANCEL',
      method: 'PATCH',
      endpoint: 'cancel',
      requiresConfirmation: true,
      requiresForm: true,
      primary: false,
    });
  }

  if (
    params.status === OrderStatusEnum.SHIPPED &&
    transitions.includes(OrderStatusEnum.DELIVERED)
  ) {
    const isSelfDelivery =
      params.shipment?.shippingMethod === 'SELF_DELIVERY' ||
      params.shipment?.shippingMethod === 'CUSTOMER_PICKUP';

    if (isSelfDelivery) {
      push({
        key: 'MARK_DELIVERED',
        method: 'PATCH',
        endpoint: 'status',
        targetStatus: OrderStatusEnum.DELIVERED,
        requiresConfirmation: true,
        requiresForm: false,
        primary: true,
      });
    }
  }

  if (
    params.status === OrderStatusEnum.DELIVERED &&
    transitions.includes(OrderStatusEnum.COMPLETED)
  ) {
    const isCod = params.paymentMethod === PaymentMethodEnum.COD;
    push({
      key: 'CONFIRM_PAYMENT',
      method: 'PATCH',
      endpoint: 'status',
      targetStatus: OrderStatusEnum.COMPLETED,
      requiresConfirmation: isCod,
      requiresForm: false,
      primary: true,
    });
  }

  return descriptors;
}
