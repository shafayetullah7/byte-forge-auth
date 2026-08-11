import type {
  TNewShop,
  TShop,
  TShopTranslation,
} from '@/_db/drizzle/schema/shop';
import { Shop } from '../domain/shop.entity';

export interface ShopTranslationRecord {
  id: string;
  shopId: string;
  locale: string;
  name: string;
  description: string | null;
  businessHours: string | null;
  tagline: string | null;
  about: string | null;
  sellerStory: string | null;
  brandMission: string | null;
}

export function mapShopRowToEntity(row: TShop): Shop {
  return new Shop({
    id: row.id,
    ownerId: row.ownerId,
    slug: row.slug,
    status: row.status,
    isVerified: row.isVerified,
    logoId: row.logoId ?? null,
    bannerId: row.bannerId ?? null,
    primaryColor: row.primaryColor ?? null,
    secondaryColor: row.secondaryColor ?? null,
    accentColor: row.accentColor ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function mapShopEntityToRow(shop: Shop): TShop {
  return {
    id: shop.id,
    ownerId: shop.ownerId,
    slug: shop.slug,
    status: shop.status,
    isVerified: shop.isVerified,
    logoId: shop.logoId,
    bannerId: shop.bannerId,
    primaryColor: shop.primaryColor,
    secondaryColor: shop.secondaryColor,
    accentColor: shop.accentColor,
    createdAt: shop.createdAt,
    updatedAt: shop.updatedAt,
  };
}

export function mapShopEntityToUpdatePatch(shop: Shop): Partial<TNewShop> {
  return {
    slug: shop.slug,
    status: shop.status,
    isVerified: shop.isVerified,
    logoId: shop.logoId,
    bannerId: shop.bannerId,
    primaryColor: shop.primaryColor,
    secondaryColor: shop.secondaryColor,
    accentColor: shop.accentColor,
    updatedAt: shop.updatedAt,
  };
}

export function mapShopTranslationRow(
  row: TShopTranslation,
): ShopTranslationRecord {
  return {
    id: row.id,
    shopId: row.shopId,
    locale: row.locale,
    name: row.name,
    description: row.description ?? null,
    businessHours: row.businessHours ?? null,
    tagline: row.tagline ?? null,
    about: row.about ?? null,
    sellerStory: row.sellerStory ?? null,
    brandMission: row.brandMission ?? null,
  };
}

export function mapShopTranslationRows(
  rows: TShopTranslation[],
): ShopTranslationRecord[] {
  return rows.map(mapShopTranslationRow);
}
