import type { TMedia, TShop, TShopTranslation } from '@/_db/drizzle/schema';
import type { TShopAddress } from '@/_db/drizzle/schema/shop/shop.address.schema';
import type { TShopAddressTranslation } from '@/_db/drizzle/schema/shop/shop.address.translation.schema';
import type { TShopContact } from '@/_db/drizzle/schema/shop/shop.contact.schema';

export type TShopWithBranding = TShop & {
  translations: TShopTranslation[];
  logo: TMedia | null;
  banner: TMedia | null;
};

export type ShopContactDetails = {
  businessEmail: string | null;
  phone: string | null;
  alternativePhone: string | null;
  whatsapp: string | null;
  telegram: string | null;
  facebook: string | null;
  instagram: string | null;
  x: string | null;
};

export type ShopAddressTranslation = {
  locale: string;
  country: string;
  division: string;
  district: string;
  street: string;
};

export type ShopAddressDetails = {
  postalCode: string | null;
  latitude: string | null;
  longitude: string | null;
  googleMapsLink: string | null;
  isVerified: boolean;
  translations: ShopAddressTranslation[];
};

export type LocalizedShopDetails = {
  id: string;
  ownerId: string;
  slug: string;
  logoId: string | null;
  bannerId: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  description: string | null;
  businessHours: string | null;
  logo: {
    id: string;
    url: string;
    mimeType: string;
    fileName: string;
    size: number;
  } | null;
  banner: {
    id: string;
    url: string;
    mimeType: string;
    fileName: string;
    size: number;
  } | null;
  translations: Array<{
    id: string;
    shopId: string;
    locale: string;
    name: string;
    description: string | null;
    businessHours: string | null;
  }>;
  contact: ShopContactDetails | null;
  address: ShopAddressDetails | null;
};

/** Minimal shop status for seller routing decisions. */
export type MyShopStatusResponse = {
  id: string;
  slug: string;
  status: string;
  hasTranslations: boolean;
  rejectionReason: string | null;
};

export type LocalizedShopSource = TShopWithBranding & {
  shopContactTable?: TShopContact | null;
  shopAddressTable?:
    | (TShopAddress & { translations: TShopAddressTranslation[] })
    | null;
};
