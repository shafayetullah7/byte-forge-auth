import type { ArticleTranslationInput } from '../repositories/article.repository.types';

type ArticleWithRelations = {
  id: string;
  shopId: string;
  slug: string;
  coverImageId: string | null;
  category: string | null;
  readMinutes: number | null;
  moderationStatus: string;
  rejectedReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  translations: Array<{
    locale: string;
    title: string;
    excerpt: string | null;
    body: string | null;
  }>;
  coverImage?: { id: string; url: string } | null;
};

export function mapSellerArticle(article: ArticleWithRelations) {
  const translations = toTranslationObject(article.translations);
  return {
    id: article.id,
    slug: article.slug,
    coverImage: article.coverImage
      ? { id: article.coverImage.id, url: article.coverImage.url }
      : null,
    category: article.category,
    readMinutes: article.readMinutes,
    moderationStatus: article.moderationStatus,
    rejectedReason: article.rejectedReason,
    translations,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  };
}

export function mapSellerArticleListItem(article: ArticleWithRelations) {
  const en = article.translations.find((t) => t.locale === 'en');
  return {
    id: article.id,
    slug: article.slug,
    title: en?.title ?? '',
    category: article.category,
    readMinutes: article.readMinutes,
    moderationStatus: article.moderationStatus,
    createdAt: article.createdAt.toISOString(),
  };
}

function toTranslationObject(
  rows: Array<{
    locale: string;
    title: string;
    excerpt: string | null;
    body: string | null;
  }>,
): ArticleTranslationInput {
  const en = rows.find((t) => t.locale === 'en');
  const bn = rows.find((t) => t.locale === 'bn');
  return {
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
  };
}

export type { ArticleWithRelations };
