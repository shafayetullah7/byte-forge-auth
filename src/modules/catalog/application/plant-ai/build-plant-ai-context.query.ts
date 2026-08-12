import { Injectable } from '@nestjs/common';
import {
  CareDifficultyEnum,
  GrowthRateEnum,
  HumidityLevelEnum,
  LightRequirementEnum,
  WateringFrequencyEnum,
} from '@/_db/drizzle/enum/plant-care.enum';
import { resolveTranslation } from '@/libs/utils/resolve-translation.util';
import { CategoryAdminRepository } from '../../repositories/category-admin.repository';
import { TagGroupAdminRepository } from '../../repositories/tag-group-admin.repository';
import type { PlantAiDraftAllowlists } from './plant-ai-draft.schema';

export type PlantAiCategoryOption = {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
};

export type PlantAiTagOption = {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  groupSlug: string;
};

export type PlantAiPromptContext = {
  categories: PlantAiCategoryOption[];
  tags: PlantAiTagOption[];
  enums: {
    lightRequirement: string[];
    wateringFrequency: string[];
    humidityLevel: string[];
    careDifficulty: string[];
    growthRate: string[];
  };
};

function localizedName(
  translations: Array<{ locale: string; name: string }>,
  locale: 'en' | 'bn',
): string {
  return (
    resolveTranslation(translations, locale)?.name ??
    resolveTranslation(translations, 'en')?.name ??
    'Unnamed'
  );
}

export function plantAiAllowlistsFromContext(
  context: PlantAiPromptContext,
): PlantAiDraftAllowlists {
  return {
    categoryIds: new Set(context.categories.map((c) => c.id)),
    tagIds: new Set(context.tags.map((t) => t.id)),
  };
}

@Injectable()
export class BuildPlantAiContextQuery {
  constructor(
    private readonly categoryAdminRepository: CategoryAdminRepository,
    private readonly tagGroupAdminRepository: TagGroupAdminRepository,
  ) {}

  async execute(): Promise<PlantAiPromptContext> {
    const [categories, tagGroups] = await Promise.all([
      this.categoryAdminRepository.listActivePublic(),
      this.tagGroupAdminRepository.listActiveWithTags(),
    ]);

    const categoryOptions: PlantAiCategoryOption[] = categories.map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      nameEn: localizedName(cat.translations, 'en'),
      nameBn: localizedName(cat.translations, 'bn'),
    }));

    const tagOptions: PlantAiTagOption[] = [];
    for (const group of tagGroups) {
      for (const tag of group.tags) {
        tagOptions.push({
          id: tag.id,
          slug: tag.slug,
          groupSlug: group.slug,
          nameEn: localizedName(tag.translations, 'en'),
          nameBn: localizedName(tag.translations, 'bn'),
        });
      }
    }

    return {
      categories: categoryOptions,
      tags: tagOptions,
      enums: {
        lightRequirement: Object.keys(LightRequirementEnum),
        wateringFrequency: Object.keys(WateringFrequencyEnum),
        humidityLevel: Object.keys(HumidityLevelEnum),
        careDifficulty: Object.keys(CareDifficultyEnum),
        growthRate: Object.keys(GrowthRateEnum),
      },
    };
  }
}
