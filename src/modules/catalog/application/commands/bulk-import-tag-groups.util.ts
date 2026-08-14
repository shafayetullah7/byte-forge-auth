import { BadRequestException } from '@nestjs/common';
import type {
  TagGroupImportInput,
  TagImportInput,
} from '../../controllers/dto/bulk-import-tag-groups.dto';
import type { NormalizedGroupImport, NormalizedTagImport } from './bulk-import-tag-groups.types';

type TranslationInput = TagImportInput['translations'];

export function normalizeTranslations(
  translations: TranslationInput,
): NormalizedTagImport['translations'] {
  if (Array.isArray(translations)) {
    const locales = translations.map((t) => t.locale);
    if (!locales.includes('en') || !locales.includes('bn')) {
      throw new BadRequestException(
        'Both English (en) and Bengali (bn) translations are required',
      );
    }
    return translations.map((t) => ({
      locale: t.locale,
      name: t.name,
      description: t.description ?? null,
    }));
  }

  return [
    {
      locale: 'en',
      name: translations.en.name,
      description: translations.en.description ?? null,
    },
    {
      locale: 'bn',
      name: translations.bn.name,
      description: translations.bn.description ?? null,
    },
  ];
}

export function normalizeTagImport(tag: TagImportInput): NormalizedTagImport {
  return {
    slug: tag.slug,
    isActive: tag.isActive,
    translations: normalizeTranslations(tag.translations),
  };
}

export function normalizeGroupImport(
  group: TagGroupImportInput,
): NormalizedGroupImport {
  const existing = group.existing === true;
  const translations =
    group.translations !== undefined
      ? normalizeTranslations(group.translations)
      : undefined;

  if (!existing && !translations) {
    throw new BadRequestException(
      `Group '${group.slug}' requires translations when not marked existing`,
    );
  }

  return {
    slug: group.slug,
    isActive: group.isActive,
    existing,
    translations,
    tags: (group.tags ?? []).map(normalizeTagImport),
  };
}
