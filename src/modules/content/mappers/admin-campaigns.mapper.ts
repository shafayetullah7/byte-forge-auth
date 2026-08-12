type ShopWithTranslations = {
  id: string;
  slug: string;
  translations?: Array<{ locale: string; name: string }>;
};

export type CampaignAdminRow = {
  id: string;
  shopId: string;
  slug: string;
  type: string;
  bannerId: string | null;
  discountPercent: number | null;
  startDate: Date;
  endDate: Date;
  moderationStatus: string;
  rejectedReason: string | null;
  moderatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  translations: Array<{
    locale: string;
    title: string;
    description: string | null;
  }>;
  banner?: { id: string; url: string } | null;
  shop?: ShopWithTranslations | null;
  products?: Array<{
    productId: string;
    product?: {
      id: string;
      slug: string;
      translations?: Array<{ locale: string; name: string }>;
    } | null;
  }>;
};

function mapShopSummary(shop?: ShopWithTranslations | null) {
  if (!shop) return null;
  const en = shop.translations?.find((t) => t.locale === 'en');
  return {
    id: shop.id,
    slug: shop.slug,
    name: en?.name ?? shop.slug,
  };
}

export function mapAdminCampaignListItem(campaign: CampaignAdminRow) {
  const en = campaign.translations.find((t) => t.locale === 'en');
  return {
    id: campaign.id,
    slug: campaign.slug,
    type: campaign.type,
    title: en?.title ?? '',
    moderationStatus: campaign.moderationStatus,
    startDate: campaign.startDate.toISOString(),
    endDate: campaign.endDate.toISOString(),
    shop: mapShopSummary(campaign.shop),
    createdAt: campaign.createdAt.toISOString(),
  };
}

export function mapAdminCampaignDetail(campaign: CampaignAdminRow) {
  const en = campaign.translations.find((t) => t.locale === 'en');
  const bn = campaign.translations.find((t) => t.locale === 'bn');

  return {
    id: campaign.id,
    shopId: campaign.shopId,
    slug: campaign.slug,
    type: campaign.type,
    banner: campaign.banner
      ? { id: campaign.banner.id, url: campaign.banner.url }
      : null,
    discountPercent: campaign.discountPercent,
    startDate: campaign.startDate.toISOString(),
    endDate: campaign.endDate.toISOString(),
    moderationStatus: campaign.moderationStatus,
    rejectedReason: campaign.rejectedReason,
    moderatedAt: campaign.moderatedAt?.toISOString() ?? null,
    title: en?.title ?? '',
    translations: {
      en: {
        title: en?.title ?? '',
        description: en?.description ?? null,
      },
      bn: {
        title: bn?.title ?? '',
        description: bn?.description ?? null,
      },
    },
    products:
      campaign.products?.map((row) => ({
        id: row.product?.id ?? row.productId,
        slug: row.product?.slug ?? '',
        name:
          row.product?.translations?.find((t) => t.locale === 'en')?.name ?? '',
      })) ?? [],
    shop: mapShopSummary(campaign.shop),
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
  };
}
