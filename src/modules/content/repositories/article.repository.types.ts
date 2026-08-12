export const ARTICLE_LOCALES = ['en', 'bn'] as const;

export type ArticleTranslationInput = {
  en: { title: string; excerpt?: string | null; body?: string | null };
  bn: { title: string; excerpt?: string | null; body?: string | null };
};

export type SellerArticleListQuery = {
  page: number;
  limit: number;
  search?: string;
  moderationStatus?: string;
  sortOrder?: 'asc' | 'desc';
};

export type AdminArticleListQuery = {
  page: number;
  limit: number;
  search?: string;
  moderationStatus?: string;
};
