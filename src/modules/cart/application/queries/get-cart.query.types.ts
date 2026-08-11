export type CartItemResult = {
  id: string;
  variantId: string;
  quantity: number;
  price: string;
  lineTotal: string;
  productName: string;
  productSlug: string;
  productType: string;
  shopId: string;
  thumbnail: { id: string; url: string } | null;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  availableQuantity: number | null;
  maxQuantity: number;
  variantAttributes: {
    growthStage?: string;
    plantForm?: string;
    variegation?: string;
    leafDensity?: string;
    containerType?: string;
    containerSize?: string;
  } | null;
  variantTitle?: string;
  sku?: string;
};

export type CartResult = {
  id: string;
  itemsCount: number;
  totalQuantity: number;
  subtotal: string;
  items: CartItemResult[];
  createdAt: Date;
  updatedAt: Date;
};

export type CartCountResult = {
  itemsCount: number;
  totalQuantity: number;
};
