export type ValidateIssue = {
  itemId: string;
  variantId: string;
  productName: string;
  issue:
    | 'variant_not_found'
    | 'variant_deactivated'
    | 'product_unavailable'
    | 'insufficient_stock';
  details: string;
  availableQuantity?: number;
};

export type ValidateCartResult = {
  isValid: boolean;
  issues: ValidateIssue[];
  validItemsCount: number;
  invalidItemsCount: number;
};
