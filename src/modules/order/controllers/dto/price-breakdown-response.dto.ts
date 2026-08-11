export class PriceBreakdownItemDto {
  id: string;
  variantId: string;
  quantity: number;
  price: string;
  lineTotal: string;
  productName: string;
  productSlug: string;
  shopId: string;
  shopName: string;
  thumbnail: { id: string; url: string } | null;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  availableQuantity: number | null;
  variantTitle?: string;
  sku?: string;
}

export class ShopPriceBreakdownDto {
  shopId: string;
  shopName: string;
  items: PriceBreakdownItemDto[];
  itemsSubtotal: string;
  shippingCost: string;
}

export class PriceBreakdownDto {
  subtotal: string;
  shipping: string;
  tax: string;
  total: string;
  shopBreakdowns: ShopPriceBreakdownDto[];
}

export class PriceBreakdownResponseDto {
  breakdown: PriceBreakdownDto;
}
