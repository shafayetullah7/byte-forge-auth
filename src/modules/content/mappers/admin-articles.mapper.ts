type ShopWithTranslations = {
  id: string;
  slug: string;
  translations?: Array<{ locale: string; name: string }>;
};

export type ArticleAdminRow = {
  id: string;
  shopId: string;
  slug: string;
  category: string | null;
  readMinutes: number | null;
  isEditorsPick: boolean;
  editorsPickAt: Date | null;
  moderationStatus: string;
  rejectedReason: string | null;
  moderatedAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  translations: Array<{
    locale: string;
    title: string;
    excerpt: string | null;
    body: string | null;
  }>;
  coverImage?: { id: string; url: string } | null;
  shop?: ShopWithTranslations | null;
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

export function mapAdminArticleListItem(article: ArticleAdminRow) {
  const en = article.translations.find((t) => t.locale === 'en');
  return {
    id: article.id,
    slug: article.slug,
    title: en?.title ?? '',
    category: article.category,
    moderationStatus: article.moderationStatus,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    isEditorsPick: article.isEditorsPick,
    shop: mapShopSummary(article.shop),
    createdAt: article.createdAt.toISOString(),
  };
}

export function mapAdminArticleDetail(article: ArticleAdminRow) {
  const en = article.translations.find((t) => t.locale === 'en');
  const bn = article.translations.find((t) => t.locale === 'bn');

  return {
    id: article.id,
    shopId: article.shopId,
    slug: article.slug,
    category: article.category,
    readMinutes: article.readMinutes,
    coverImage: article.coverImage
      ? { id: article.coverImage.id, url: article.coverImage.url }
      : null,
    moderationStatus: article.moderationStatus,
    rejectedReason: article.rejectedReason,
    moderatedAt: article.moderatedAt?.toISOString() ?? null,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    isEditorsPick: article.isEditorsPick,
    editorsPickAt: article.editorsPickAt?.toISOString() ?? null,
    title: en?.title ?? '',
    translations: {
      en: {
        title: en?.title ?? '',
        excerpt: en?.excerpt ?? null,
        body: en?.body ?? null,
      },
      bn: {
        title: bn?.title ?? '',
        excerpt: bn?.excerpt ?? null,
        body: bn?.body ?? null,
      },
    },
    shop: mapShopSummary(article.shop),
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  };
}
