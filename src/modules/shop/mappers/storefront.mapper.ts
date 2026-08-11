export function mapStorefrontListItemForSeller(item: {
  id: string;
  displayOrder: number;
  translations: Array<{ locale: string; text: string }>;
}) {
  const en = item.translations.find((t) => t.locale === 'en');
  const bn = item.translations.find((t) => t.locale === 'bn');
  return {
    id: item.id,
    displayOrder: item.displayOrder,
    translations: {
      en: { text: en?.text ?? '' },
      bn: { text: bn?.text ?? '' },
    },
  };
}

export function mapStorefrontProfileTranslations(
  translations:
    | Array<{
        locale: string;
        tagline: string | null;
        about: string | null;
        sellerStory: string | null;
        brandMission: string | null;
      }>
    | undefined,
) {
  const en = translations?.find((t) => t.locale === 'en');
  const bn = translations?.find((t) => t.locale === 'bn');
  return {
    en: {
      tagline: en?.tagline ?? '',
      about: en?.about ?? '',
      sellerStory: en?.sellerStory ?? '',
      brandMission: en?.brandMission ?? '',
    },
    bn: {
      tagline: bn?.tagline ?? '',
      about: bn?.about ?? '',
      sellerStory: bn?.sellerStory ?? '',
      brandMission: bn?.brandMission ?? '',
    },
  };
}
