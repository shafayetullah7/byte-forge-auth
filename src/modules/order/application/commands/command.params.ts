import type { OrderStatus } from '../../domain/order-status';

export interface CancelSellerOrderParams {
  reason: string;
  expectedUpdatedAt?: string;
}

export type SellerShippingMethod =
  | 'COURIER'
  | 'SELF_DELIVERY'
  | 'CUSTOMER_PICKUP';

export interface ShipSellerOrderParams {
  carrier?: string;
  trackingNumber?: string;
  shippingMethod: SellerShippingMethod;
  estimatedDelivery?: string;
  notes?: string;
  expectedUpdatedAt?: string;
}

export interface UpdateSellerOrderStatusParams {
  status: OrderStatus;
  notes?: string;
  expectedUpdatedAt?: string;
}
