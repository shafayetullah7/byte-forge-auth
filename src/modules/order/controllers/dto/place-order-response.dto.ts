export class PlaceOrderItemDto {
  id: string;
  orderId: string;
  variantId: string;
  productId: string;
  productName: string;
  variantTitle: string | null;
  sku: string | null;
  unitPrice: string;
  quantity: number;
  subtotal: string;
}

export class PlaceOrderAddressDto {
  id: string;
  orderId: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  companyName: string | null;
  deliveryInstructions: string | null;
}

export class PlaceOrderStatusHistoryDto {
  id: string;
  orderId: string;
  fromStatus: string | null;
  toStatus: string;
  notes: string | null;
  changedBy: string | null;
}

export class PlaceOrderDto {
  id: string;
  orderNumber: string;
  shopId: string;
  shopName: string;
  status: string;
  subtotal: string;
  shippingCost: string;
  tax: string;
  total: string;
  paymentStatus: string;
  paymentMethod: string | null;
  items: PlaceOrderItemDto[];
  address: PlaceOrderAddressDto | null;
  statusHistory: PlaceOrderStatusHistoryDto[];
}

export class PlaceOrderGroupDto {
  id: string;
  totalAmount: string;
  orders: PlaceOrderDto[];
}

export class PlaceOrderResponseDto {
  orderGroup: PlaceOrderGroupDto;
}
