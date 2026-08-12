export const CAMPAIGN_LOCALES = ['en', 'bn'] as const;

export type CampaignTranslationInput = {
  en: { title: string; description?: string | null };
  bn: { title: string; description?: string | null };
};

export type SellerCampaignListQuery = {
  page: number;
  limit: number;
  search?: string;
  moderationStatus?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type AdminCampaignListQuery = {
  page: number;
  limit: number;
  search?: string;
  moderationStatus?: string;
};
