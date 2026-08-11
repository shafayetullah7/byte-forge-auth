import type { TOrderStatus, TPaymentStatus } from '@/_db/drizzle/enum';

export interface BuyerOrdersFilterParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  orderStatus?: TOrderStatus;
  paymentStatus?: TPaymentStatus;
  search?: string;
}

export interface SellerOrdersFilterParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'total';
  sortOrder?: 'asc' | 'desc';
  orderStatus?: TOrderStatus;
  paymentStatus?: TPaymentStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AdminOrdersFilterParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'total';
  sortOrder?: 'asc' | 'desc';
  shopId?: string;
  userId?: string;
  orderStatus?: TOrderStatus;
  paymentStatus?: TPaymentStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AdminOrderStatsFilterParams {
  shopId?: string;
  userId?: string;
}
