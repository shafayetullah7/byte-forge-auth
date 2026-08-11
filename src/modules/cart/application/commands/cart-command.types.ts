import type {
  CartItemResult,
  CartResult,
} from '../queries/get-cart.query.types';

export type AddToCartParams = {
  cartId: string;
  variantId: string;
  quantity: number;
  locale?: string;
};

export type UpdateCartItemParams = {
  cartId: string;
  itemId: string;
  quantity: number;
  locale?: string;
};

export type BulkUpdateCartItemInput = {
  itemId: string;
  quantity: number;
};

export type BulkUpdateCartParams = {
  cartId: string;
  items: BulkUpdateCartItemInput[];
  locale?: string;
};

export type BulkUpdateCartItemResult = CartItemResult;

export type BulkUpdateCartResult = {
  updated: BulkUpdateCartItemResult[];
  removed: { itemId: string; variantId: string }[];
  errors: { itemId: string; error: string }[];
};

export type BulkRemoveCartParams = {
  cartId: string;
  itemIds: string[];
};

export type BulkRemoveCartResult = {
  removedCount: number;
  notFound: string[];
};

export type MergeCartGuestItem = {
  variantId: string;
  quantity: number;
};

export type MergeCartParams = {
  cartId: string;
  guestItems: MergeCartGuestItem[];
  locale?: string;
};

export type MergeCartResult = {
  mergedCount: number;
  failedItems: { variantId: string; reason: string }[];
  cart: CartResult;
};

export type { CartItemResult as AddToCartResult };
export type { CartItemResult as UpdateCartItemResult };
