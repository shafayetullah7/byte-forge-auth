import type { CampaignTranslationInput } from '../repositories/campaign.repository.types';

type CampaignWithRelations = {
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
  createdAt: Date;
  updatedAt: Date;
  translations: Array<{
    locale: string;
    title: string;
    description: string | null;
  }>;
  banner?: { id: string; url: string } | null;
  products?: Array<{ productId: string }>;
};

export function mapSellerCampaign(campaign: CampaignWithRelations) {
  const translations = toTranslationObject(campaign.translations);
  return {
    id: campaign.id,
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
    productIds: campaign.products?.map((p) => p.productId) ?? [],
    translations,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
  };
}

export function mapSellerCampaignListItem(campaign: CampaignWithRelations) {
  const en = campaign.translations.find((t) => t.locale === 'en');
  return {
    id: campaign.id,
    slug: campaign.slug,
    type: campaign.type,
    title: en?.title ?? '',
    moderationStatus: campaign.moderationStatus,
    startDate: campaign.startDate.toISOString(),
    endDate: campaign.endDate.toISOString(),
    productCount: campaign.products?.length ?? 0,
    createdAt: campaign.createdAt.toISOString(),
  };
}

function toTranslationObject(
  rows: Array<{ locale: string; title: string; description: string | null }>,
): CampaignTranslationInput {
  const en = rows.find((t) => t.locale === 'en');
  const bn = rows.find((t) => t.locale === 'bn');
  return {
    en: {
      title: en?.title ?? '',
      description: en?.description ?? null,
    },
    bn: {
      title: bn?.title ?? '',
      description: bn?.description ?? null,
    },
  };
}
