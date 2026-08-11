import { resolveTranslation } from '@/common/utils/resolve-translation.util';
import { computeCampaignStatus } from '@/common/utils/compute-campaign-status.util';
import type { TShopCampaignTranslation } from '@/_db/drizzle/schema/shop';

type CampaignRow = {
  id: string;
  type: string;
  startDate: Date;
  endDate: Date;
  discountPercent: number | null;
  translations: TShopCampaignTranslation[];
  banner?: { url: string } | null;
  products?: Array<unknown>;
};

export function mapPublicShopCampaign(campaign: CampaignRow, lang: string) {
  const translation = resolveTranslation(campaign.translations, lang);
  return {
    id: campaign.id,
    title: translation?.title ?? '',
    type: campaign.type,
    bannerUrl: campaign.banner?.url ?? '',
    startDate: campaign.startDate.toISOString(),
    endDate: campaign.endDate.toISOString(),
    discountPercent: campaign.discountPercent,
    description: translation?.description ?? '',
    status: computeCampaignStatus(campaign.startDate, campaign.endDate),
    participants: 0,
    views: 0,
    productsIncluded: campaign.products?.length ?? 0,
    ordersGenerated: 0,
    savingsProvided: 0,
    likes: 0,
    bookmarks: 0,
  };
}

export function mapPublicShopCampaignHighlights(campaigns: CampaignRow[]) {
  const now = new Date();
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const recent = campaigns.filter((c) => c.startDate >= twelveMonthsAgo);

  return {
    campaignsLast12Months: recent.length,
    totalSavingsBdt: 0,
    totalParticipants: 0,
    mostSuccessfulReach: 0,
  };
}
