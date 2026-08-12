import { resolveTranslation } from '@/libs/utils/resolve-translation.util';
import type {
  LocalizedShopDetails,
  LocalizedShopSource,
} from './shop.mapper.types';

export type {
  LocalizedShopDetails,
  MyShopStatusResponse,
  ShopAddressDetails,
  ShopContactDetails,
  TShopWithBranding,
} from './shop.mapper.types';

export function mapToLocalizedShopDetails(
  shop: LocalizedShopSource,
  lang: string,
): LocalizedShopDetails {
  const translation = resolveTranslation(shop.translations, lang) as {
    name: string;
    description: string | null;
    businessHours: string | null;
  } | null;

  return {
    id: shop.id,
    ownerId: shop.ownerId,
    slug: shop.slug,
    logoId: shop.logoId,
    bannerId: shop.bannerId,
    status: shop.status,
    createdAt: shop.createdAt,
    updatedAt: shop.updatedAt,
    name: translation?.name ?? '',
    description: translation?.description ?? null,
    businessHours: translation?.businessHours ?? null,
    logo: shop.logo
      ? {
          id: shop.logo.id,
          url: shop.logo.url,
          mimeType: shop.logo.mimeType,
          fileName: shop.logo.fileName,
          size: shop.logo.size,
        }
      : null,
    banner: shop.banner
      ? {
          id: shop.banner.id,
          url: shop.banner.url,
          mimeType: shop.banner.mimeType,
          fileName: shop.banner.fileName,
          size: shop.banner.size,
        }
      : null,
    translations: shop.translations,
    contact: shop.shopContactTable
      ? {
          businessEmail: shop.shopContactTable.businessEmail,
          phone: shop.shopContactTable.phone,
          alternativePhone: shop.shopContactTable.alternativePhone,
          whatsapp: shop.shopContactTable.whatsapp,
          telegram: shop.shopContactTable.telegram,
          facebook: shop.shopContactTable.facebook,
          instagram: shop.shopContactTable.instagram,
          x: shop.shopContactTable.x,
        }
      : null,
    address: shop.shopAddressTable
      ? {
          postalCode: shop.shopAddressTable.postalCode,
          latitude: shop.shopAddressTable.latitude,
          longitude: shop.shopAddressTable.longitude,
          googleMapsLink: shop.shopAddressTable.googleMapsLink,
          isVerified: shop.shopAddressTable.isVerified,
          translations:
            shop.shopAddressTable.translations?.map((t) => ({
              locale: t.locale,
              country: t.country,
              division: t.division,
              district: t.district,
              street: t.street,
            })) || [],
        }
      : null,
  };
}
