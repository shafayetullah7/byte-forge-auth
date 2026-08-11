export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export class CartItemDto {
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
  stockStatus: StockStatus;
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
}

export class CartDto {
  id: string;
  itemsCount: number;
  totalQuantity: number;
  subtotal: string;
  items: CartItemDto[];
  createdAt: string;
  updatedAt: string;
}

export class CartCountDto {
  itemsCount: number;
  totalQuantity: number;
}

export class CartValidationIssueDto {
  itemId: string;
  variantId: string;
  productName: string;
  issue:
    | 'variant_not_found'
    | 'variant_deactivated'
    | 'product_unavailable'
    | 'insufficient_stock'
    | 'shop_closed';
  details: string;
  availableQuantity?: number;
}

export class CartValidationResultDto {
  isValid: boolean;
  issues: CartValidationIssueDto[];
  validItemsCount: number;
  invalidItemsCount: number;
}

export class BulkUpdateResultDto {
  updated: CartItemDto[];
  removed: { itemId: string; variantId: string }[];
  errors: { itemId: string; error: string }[];
}

export class BulkRemoveResultDto {
  removedCount: number;
  notFound: string[];
}

export class MergeCartResultDto {
  mergedCount: number;
  failedItems: { variantId: string; reason: string }[];
  cart: CartDto;
}
