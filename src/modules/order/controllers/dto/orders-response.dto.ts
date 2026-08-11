export class OrderItemResponseDto {
  id: string;
  productName: string;
  variantTitle: string | null;
  quantity: number;
  total: string;
  thumbnail: { id: string; url: string } | null;
}

export class OrderResponseDto {
  id: string;
  orderNumber: string;
  shopId: string;
  shopName: string;
  shopLogo: string | null;
  status: string;
  paymentStatus: string;
  total: string;
  createdAt: string;
  items: OrderItemResponseDto[];
}

export class OrderGroupResponseDto {
  id: string;
  totalAmount: string;
  createdAt: string;
  orders: OrderResponseDto[];
}

export class OrderStatsResponseDto {
  total: number;
  active: number;
  delivered: number;
  cancelled: number;
  totalSpent: string;
}

export class GetOrdersResponseDto {
  data: OrderGroupResponseDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class OrderItemDetailResponseDto {
  id: string;
  productId: string;
  productName: string;
  variantTitle: string | null;
  sku: string | null;
  unitPrice: string;
  quantity: number;
  subtotal: string;
  thumbnail: { id: string; url: string } | null;
  canReview: boolean;
  reviewId: string | null;
  reviewStatus: string | null;
}

export class OrderAddressDetailResponseDto {
  id: string;
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

export class OrderStatusHistoryDetailResponseDto {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  notes: string | null;
  createdAt: string;
}

export class OrderDetailResponseDto {
  id: string;
  orderNumber: string;
  shopId: string;
  shopName: string;
  shopLogo: string | null;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  subtotal: string;
  shippingCost: string;
  tax: string;
  total: string;
  notes: string | null;
  cancelledAt: string | null;
  cancelledReason: string | null;
  createdAt: string;
  updatedAt: string;
  address: OrderAddressDetailResponseDto | null;
  items: OrderItemDetailResponseDto[];
  statusHistory: OrderStatusHistoryDetailResponseDto[];
}

export class OrderGroupDetailResponseDto {
  id: string;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  orders: OrderDetailResponseDto[];
}

export class GetOrderGroupResponseDto {
  data: OrderGroupDetailResponseDto;
}
