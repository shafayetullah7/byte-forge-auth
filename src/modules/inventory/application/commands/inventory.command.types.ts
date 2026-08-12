export interface OrderInventoryItem {
  variantId: string;
  shopId: string;
  quantity: number;
  productName?: string;
}

export interface SeedVariantStockParams {
  variantId: string;
  shopId: string;
  userId: string;
  quantity: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
}
