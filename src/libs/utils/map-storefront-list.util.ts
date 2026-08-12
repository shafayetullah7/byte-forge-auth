import { resolveTranslation } from '@/libs/utils/resolve-translation.util';

type TranslatedListItem = {
  isActive: boolean;
  displayOrder: number;
  translations: Array<{ locale: string; text: string }>;
};

export function mapStorefrontListToStrings(
  items: TranslatedListItem[],
  lang: string,
): string[] {
  return items
    .filter((item) => item.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((item) => resolveTranslation(item.translations, lang)?.text ?? '')
    .filter((text) => text.trim().length > 0);
}
