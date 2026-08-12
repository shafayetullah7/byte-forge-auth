import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PlantAiDraftLocaleBlockDto {
  @ApiProperty({ example: 'Monstera' })
  name!: string;

  @ApiPropertyOptional({
    example: 'Popular tropical foliage plant with split leaves.',
  })
  shortDescription?: string;

  @ApiPropertyOptional({
    example:
      'Monstera deliciosa is a hardy indoor plant suited to bright indirect light.',
  })
  description?: string;
}

class PlantAiDraftTranslationsDto {
  @ApiProperty({ type: () => PlantAiDraftLocaleBlockDto })
  en!: PlantAiDraftLocaleBlockDto;

  @ApiProperty({ type: () => PlantAiDraftLocaleBlockDto })
  bn!: PlantAiDraftLocaleBlockDto;
}

class PlantAiDraftDetailsLocaleDto {
  @ApiPropertyOptional({ example: 'Swiss cheese plant' })
  commonNames?: string;

  @ApiPropertyOptional({ example: 'Central America' })
  origin?: string;

  @ApiPropertyOptional({ example: 'Well-draining potting mix' })
  soilType?: string;

  @ApiPropertyOptional({ example: 'Toxic to pets if ingested' })
  toxicityInfo?: string;
}

class PlantAiDraftDetailsTranslationsDto {
  @ApiProperty({ type: () => PlantAiDraftDetailsLocaleDto })
  en!: PlantAiDraftDetailsLocaleDto;

  @ApiProperty({ type: () => PlantAiDraftDetailsLocaleDto })
  bn!: PlantAiDraftDetailsLocaleDto;
}

class PlantAiDraftPlantDetailsDto {
  @ApiPropertyOptional({ example: 'Monstera deliciosa' })
  scientificName?: string;

  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  categoryId!: string;

  @ApiProperty({ type: [String], example: ['22222222-2222-4222-8222-222222222222'] })
  tagIds!: string[];

  @ApiProperty({ example: 'BRIGHT_INDIRECT' })
  lightRequirement!: string;

  @ApiProperty({ example: 'WEEKLY' })
  wateringFrequency!: string;

  @ApiProperty({ example: 'MEDIUM' })
  humidityLevel!: string;

  @ApiProperty({ example: 'BEGINNER' })
  careDifficulty!: string;

  @ApiPropertyOptional({ example: 'MODERATE' })
  growthRate?: string;

  @ApiPropertyOptional({ example: '18-30°C' })
  temperatureRange?: string;

  @ApiPropertyOptional({ example: 'Up to 3m' })
  matureHeight?: string;

  @ApiPropertyOptional({ example: 'Up to 1.5m' })
  matureSpread?: string;

  @ApiProperty({ type: () => PlantAiDraftDetailsTranslationsDto })
  translations!: PlantAiDraftDetailsTranslationsDto;
}

class PlantAiDraftCareGuideLocaleDto {
  @ApiPropertyOptional()
  lightInstructions?: string;

  @ApiPropertyOptional()
  wateringInstructions?: string;

  @ApiPropertyOptional()
  humidityInstructions?: string;

  @ApiPropertyOptional()
  fertilizerSchedule?: string;

  @ApiPropertyOptional()
  repottingFrequency?: string;

  @ApiPropertyOptional()
  pruningNotes?: string;

  @ApiPropertyOptional()
  commonProblems?: string;

  @ApiPropertyOptional()
  seasonalCare?: string;
}

class PlantAiDraftCareGuideDto {
  @ApiProperty({ type: () => PlantAiDraftCareGuideLocaleDto })
  en!: PlantAiDraftCareGuideLocaleDto;

  @ApiProperty({ type: () => PlantAiDraftCareGuideLocaleDto })
  bn!: PlantAiDraftCareGuideLocaleDto;
}

class PlantAiDraftVariantTitleLocaleDto {
  @ApiProperty({ example: 'Juvenile climbing plant in nursery pot' })
  title!: string;
}

class PlantAiDraftVariantTranslationsDto {
  @ApiProperty({ type: () => PlantAiDraftVariantTitleLocaleDto })
  en!: PlantAiDraftVariantTitleLocaleDto;

  @ApiProperty({ type: () => PlantAiDraftVariantTitleLocaleDto })
  bn!: PlantAiDraftVariantTitleLocaleDto;
}

class PlantAiDraftDefaultVariantDto {
  @ApiProperty({ example: 'JUVENILE' })
  growthStage!: string;

  @ApiProperty({ example: 'CLIMBING' })
  plantForm!: string;

  @ApiPropertyOptional({ example: 'CUTTING' })
  propagationType?: string;

  @ApiPropertyOptional({ example: 'NURSERY_POT' })
  containerType?: string;

  @ApiProperty({ type: () => PlantAiDraftVariantTranslationsDto })
  translations!: PlantAiDraftVariantTranslationsDto;
}

export class PlantAiDraftResponseDto {
  @ApiProperty({ type: () => PlantAiDraftTranslationsDto })
  translations!: PlantAiDraftTranslationsDto;

  @ApiProperty({ type: () => PlantAiDraftPlantDetailsDto })
  plantDetails!: PlantAiDraftPlantDetailsDto;

  @ApiProperty({ type: () => PlantAiDraftCareGuideDto })
  careGuide!: PlantAiDraftCareGuideDto;

  @ApiPropertyOptional({ type: () => PlantAiDraftDefaultVariantDto })
  defaultVariant?: PlantAiDraftDefaultVariantDto;
}

export class PlantAiDraftStatusResponseDto {
  @ApiProperty({
    example: true,
    description: 'Whether plant AI draft generation is enabled on this server',
  })
  enabled!: boolean;
}
