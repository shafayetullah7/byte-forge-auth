import { resolveTranslation } from '@/common/utils/resolve-translation.util';

type ArticleTranslation = {
  locale: string;
  title: string;
  excerpt: string | null;
  body: string | null;
};

type ArticleRow = {
  id: string;
  slug: string;
  category: string | null;
  readMinutes: number | null;
  publishedAt: Date | null;
  isEditorsPick: boolean;
  translations: ArticleTranslation[];
  coverImage?: { url: string } | null;
};

export function mapPublicShopArticle(article: ArticleRow, lang: string) {
  const translation = resolveTranslation(article.translations, lang);
  return {
    id: article.id,
    slug: article.slug,
    title: translation?.title ?? '',
    excerpt: translation?.excerpt ?? '',
    body: translation?.body ?? '',
    coverUrl: article.coverImage?.url ?? '',
    publishedAt: article.publishedAt?.toISOString() ?? '',
    readMinutes: article.readMinutes ?? 0,
    category: article.category ?? '',
    viewCount: 0,
    likeCount: 0,
    shareCount: 0,
    isEditorsPick: article.isEditorsPick,
    isPopular: false,
  };
}
