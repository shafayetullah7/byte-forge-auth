import type { TMedia, TShop, TShopTranslation } from '@/_db/drizzle/schema';
import type {
  TOrder,
  TOrderAddress,
  TOrderGroup,
  TOrderItem,
  TOrderStatusHistory,
} from '@/_db/drizzle/schema/order';
import type { TShipment } from '@/_db/drizzle/schema/shipping';
import type { TOrderStatus, TPaymentStatus } from '@/_db/drizzle/enum';

export interface BuyerOrderStats {
  total: number;
  active: number;
  delivered: number;
  cancelled: number;
  totalSpent: string;
}

export interface GetBuyerOrderGroupsParams {
  userId: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  orderStatus?: TOrderStatus;
  paymentStatus?: TPaymentStatus;
  search?: string;
  lang?: string;
}

export interface GetSellerOrdersParams {
  shopId: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  orderStatus?: TOrderStatus;
  paymentStatus?: TPaymentStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  lang?: string;
}

export interface GetAdminOrdersParams {
  shopId?: string;
  userId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  orderStatus?: TOrderStatus;
  paymentStatus?: TPaymentStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  lang?: string;
}

export interface SellerOrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  revenue: string;
}

export type OrderPaymentMethodCatalog = {
  id: string;
  key: string;
  displayName: string;
  logo: TMedia | null;
} | null;

export type SellerOrderWithRelations = TOrder & {
  items: TOrderItem[];
  address: TOrderAddress | null | undefined;
  statusHistory: (TOrderStatusHistory & {
    changedByUser: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  })[];
  shipment: TShipment | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    userName: string;
    email: string | null;
  } | null;
  paymentMethodCatalog: OrderPaymentMethodCatalog;
};

export type AdminOrderWithRelations = TOrder & {
  items: TOrderItem[];
  address: TOrderAddress | null | undefined;
  statusHistory: (TOrderStatusHistory & {
    changedByUser: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  })[];
  shipment: TShipment | null;
  paymentMethodCatalog: OrderPaymentMethodCatalog;
  shop:
    | (TShop & {
        translations: TShopTranslation[];
      })
    | null;
};

export type BuyerOrderWithRelations = TOrder & {
  items: TOrderItem[];
  address: TOrderAddress | null | undefined;
  statusHistory: TOrderStatusHistory[];
  shop:
    | (TShop & {
        translations: TShopTranslation[];
        logo: TMedia | null;
      })
    | null;
  paymentMethodCatalog: OrderPaymentMethodCatalog;
};

export type BuyerOrderGroupOrderDetail = BuyerOrderWithRelations & {
  statusHistory: (TOrderStatusHistory & {
    changedByUser: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  })[];
  shipment: TShipment | null;
  shop:
    | (TShop & {
        ownerId: string;
        translations: TShopTranslation[];
        logo: TMedia | null;
      })
    | null;
};

export type BuyerOrderGroupWithDetails = TOrderGroup & {
  orders: BuyerOrderGroupOrderDetail[];
};

export type {
  TNewOrder,
  TNewOrderGroup,
  TNewOrderItem,
} from '@/_db/drizzle/schema/order';
export type { TNewShipment } from '@/_db/drizzle/schema/shipping';
