import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlantCategoryTranslationResponseDto {
  @ApiProperty({ example: 'en' })
  locale!: string;

  @ApiProperty({ example: 'Indoor Plants' })
  name!: string;
}

export class PlantCategoryResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: 'indoor-plants' })
  slug!: string;

  @ApiPropertyOptional({ example: 'Indoor Plants' })
  name?: string;

  @ApiPropertyOptional({ type: [PlantCategoryTranslationResponseDto] })
  translations?: PlantCategoryTranslationResponseDto[];
}

export class PlantTagTranslationResponseDto {
  @ApiProperty({ example: 'en' })
  locale!: string;

  @ApiProperty({ example: '4 inch' })
  name!: string;
}

export class PlantTagResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: '4-inch' })
  slug!: string;

  @ApiPropertyOptional({ example: '4 inch' })
  name?: string;

  @ApiPropertyOptional({ type: [PlantTagTranslationResponseDto] })
  translations?: PlantTagTranslationResponseDto[];
}

export class PlantThumbnailResponseDto {
  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  id!: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/...' })
  url!: string;
}

export class PlantListItemResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: 'monstera-deliciosa' })
  slug!: string;

  @ApiProperty({
    enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'],
    example: 'ACTIVE',
  })
  status!: string;

  @ApiPropertyOptional({ type: PlantThumbnailResponseDto })
  thumbnail?: PlantThumbnailResponseDto;

  @ApiPropertyOptional({ example: 'Monstera Deliciosa' })
  name?: string;

  @ApiPropertyOptional({ example: 'A popular tropical houseplant' })
  shortDescription?: string;

  @ApiPropertyOptional({ example: '29.99' })
  price?: string;

  @ApiProperty({ example: 50 })
  inventoryCount!: number;

  @ApiPropertyOptional({ type: PlantCategoryResponseDto })
  category?: PlantCategoryResponseDto;

  @ApiPropertyOptional({ type: [PlantTagResponseDto] })
  tags?: PlantTagResponseDto[];

  @ApiProperty({ type: Date })
  createdAt!: Date;

  @ApiProperty({ type: Date })
  updatedAt!: Date;
}

export class PlantCreateResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: 'monstera-deliciosa' })
  slug!: string;

  @ApiProperty({ enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'] })
  status!: string;

  @ApiPropertyOptional({ type: PlantThumbnailResponseDto })
  thumbnail?: PlantThumbnailResponseDto;

  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  shortDescription?: string;

  @ApiPropertyOptional()
  price?: string;

  @ApiProperty()
  inventoryCount!: number;

  @ApiPropertyOptional({ type: PlantCategoryResponseDto })
  category?: PlantCategoryResponseDto;

  @ApiPropertyOptional({ type: [PlantTagResponseDto] })
  tags?: PlantTagResponseDto[];

  @ApiProperty({ type: Date })
  createdAt!: Date;

  @ApiProperty({ type: Date })
  updatedAt!: Date;
}

export class PlantTranslationResponseDto {
  @ApiProperty({ example: 'en' })
  locale!: string;

  @ApiProperty({ example: 'Monstera Deliciosa' })
  name!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  shortDescription?: string;
}

export class PlantDetailsTranslationResponseDto {
  @ApiProperty({ example: 'bn' })
  locale!: string;

  @ApiPropertyOptional()
  commonNames?: string;

  @ApiPropertyOptional()
  origin?: string;

  @ApiPropertyOptional()
  soilType?: string;

  @ApiPropertyOptional()
  toxicityInfo?: string;
}

export class PlantDetailsResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  scientificName?: string;

  @ApiPropertyOptional()
  commonNames?: string;

  @ApiPropertyOptional()
  origin?: string;

  @ApiPropertyOptional()
  lightRequirement?: string;

  @ApiPropertyOptional()
  wateringFrequency?: string;

  @ApiPropertyOptional()
  humidityLevel?: string;

  @ApiPropertyOptional()
  temperatureRange?: string;

  @ApiPropertyOptional()
  soilType?: string;

  @ApiPropertyOptional()
  careDifficulty?: string;

  @ApiPropertyOptional()
  growthRate?: string;

  @ApiPropertyOptional()
  matureHeight?: string;

  @ApiPropertyOptional()
  matureSpread?: string;

  @ApiPropertyOptional()
  toxicityInfo?: string;

  @ApiPropertyOptional({ type: PlantCategoryResponseDto })
  category?: PlantCategoryResponseDto;

  @ApiPropertyOptional({ type: [PlantTagResponseDto] })
  tags?: PlantTagResponseDto[];

  @ApiPropertyOptional({ type: [PlantDetailsTranslationResponseDto] })
  translations?: PlantDetailsTranslationResponseDto[];
}

export class PlantCareTranslationResponseDto {
  @ApiProperty({ example: 'bn' })
  locale!: string;

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

export class PlantCareInstructionsResponseDto {
  @ApiProperty()
  id!: string;

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

  @ApiPropertyOptional({ type: [PlantCareTranslationResponseDto] })
  translations?: PlantCareTranslationResponseDto[];
}

export class PlantVariantMediaResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  mediaId!: string;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  url!: string;
}

export class PlantVariantAttributesResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  growthStage!: string;

  @ApiProperty()
  plantForm!: string;

  @ApiProperty()
  variegation!: string;

  @ApiProperty()
  leafDensity!: string;

  @ApiProperty()
  stemCount!: number;

  @ApiPropertyOptional()
  currentHeight?: string;

  @ApiPropertyOptional()
  currentSpread?: string;

  @ApiProperty()
  propagationType!: string;

  @ApiProperty()
  containerType!: string;

  @ApiPropertyOptional()
  containerSize?: string;

  @ApiPropertyOptional()
  bundleType?: string;
}

export class PlantVariantTranslationResponseDto {
  @ApiProperty({ example: 'en' })
  locale!: string;

  @ApiProperty({ example: 'Small (15cm)' })
  title!: string;
}

export class PlantVariantResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional()
  sku?: string;

  @ApiProperty()
  price!: string;

  @ApiProperty()
  inventoryCount!: number;

  @ApiProperty()
  trackInventory!: boolean;

  @ApiProperty()
  lowStockThreshold!: number;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty()
  isBase!: boolean;

  @ApiProperty()
  isActive!: boolean;

  @ApiPropertyOptional({ type: PlantVariantAttributesResponseDto })
  plantAttributes?: PlantVariantAttributesResponseDto;

  @ApiPropertyOptional({ type: [PlantVariantTranslationResponseDto] })
  translations?: PlantVariantTranslationResponseDto[];

  @ApiPropertyOptional({ type: [PlantVariantMediaResponseDto] })
  media?: PlantVariantMediaResponseDto[];
}

export class PlantDetailResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'] })
  status!: string;

  @ApiPropertyOptional({ type: PlantThumbnailResponseDto })
  thumbnail?: PlantThumbnailResponseDto;

  @ApiPropertyOptional({ type: [PlantTranslationResponseDto] })
  translations?: PlantTranslationResponseDto[];

  @ApiPropertyOptional({ type: PlantDetailsResponseDto })
  plantDetails?: PlantDetailsResponseDto;

  @ApiPropertyOptional({ type: PlantCareInstructionsResponseDto })
  careInstructions?: PlantCareInstructionsResponseDto;

  @ApiPropertyOptional({ type: [PlantVariantResponseDto] })
  variants?: PlantVariantResponseDto[];

  @ApiProperty({ type: Date })
  createdAt!: Date;

  @ApiProperty({ type: Date })
  updatedAt!: Date;
}
