import type { TPaymentMethod } from '@/_db/drizzle/enum/payment-method.enum';

export interface PlaceOrderItem {
  id: string;
  variantId: string;
  productId: string;
  quantity: number;
  price: string;
  productName: string;
  productSlug: string;
  shopId: string;
  shopName: string;
  variantTitle?: string;
  sku?: string;
}

export interface PlaceOrderResult {
  orderGroupId: string;
  orderNumbers: string[];
  totalAmount: string;
  orders: {
    orderId: string;
    orderNumber: string;
    shopId: string;
    shopName: string;
    total: string;
    itemCount: number;
  }[];
}

export interface PlaceOrderParams {
  cartId: string;
  userId: string;
  addressId: string;
  itemIds: string[];
  paymentMethod: TPaymentMethod;
  notes?: string;
  lang?: string;
}
