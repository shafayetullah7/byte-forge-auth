import type {
  TProductTranslation,
  TShopTranslation,
} from '@/_db/drizzle/schema';
import { resolveTranslation } from '@/common/utils/resolve-translation.util';
import type { WishlistRepository } from '../repositories/wishlist.repository';

type WishlistItemRow = Awaited<
  ReturnType<WishlistRepository['listItems']>
>[number];

export function mapWishlistItem(item: WishlistItemRow, lang: string) {
  const variant = item.variant;
  const product = variant?.product;
  const shop = product?.shop;
  const productTranslation = resolveTranslation<TProductTranslation>(
    product?.translations,
    lang,
  );
  const shopTranslation = resolveTranslation<TShopTranslation>(
    shop?.translations,
    lang,
  );

  return {
    id: item.id,
    variantId: item.variantId,
    addedAt: item.createdAt,
    variant: variant
      ? {
          id: variant.id,
          sku: variant.sku,
          price: variant.price,
        }
      : null,
    product: product
      ? {
          id: product.id,
          slug: product.slug,
          name: productTranslation?.name ?? '',
          thumbnail: product.thumbnail
            ? { id: product.thumbnail.id, url: product.thumbnail.url }
            : null,
        }
      : null,
    shop: shop
      ? {
          id: shop.id,
          slug: shop.slug,
          name: shopTranslation?.name ?? '',
        }
      : null,
  };
}
