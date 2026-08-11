import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductThumbnailResponseDto {
  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  id!: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/...' })
  url!: string;
}

export class ProductSummaryResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: 'monstera-deliciosa' })
  slug!: string;

  @ApiProperty({
    enum: ['plant', 'pot', 'seed', 'fertilizer'],
    example: 'plant',
  })
  productType!: string;

  @ApiProperty({ enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'], example: 'ACTIVE' })
  status!: string;

  @ApiProperty({ example: 'Monstera Deliciosa' })
  name!: string;

  @ApiPropertyOptional({ example: 'A tropical houseplant' })
  shortDescription?: string | null;
}

export class ProductOverviewVariantDto {
  @ApiProperty({ example: 'var-1' })
  id!: string;

  @ApiPropertyOptional({ example: 'ALBO-MED-001' })
  sku?: string | null;

  @ApiProperty({ example: '4500.00' })
  price!: string;

  @ApiProperty({ example: 8 })
  inventoryCount!: number;

  @ApiProperty({ example: 3 })
  lowStockThreshold!: number;

  @ApiProperty({ example: true })
  isBase!: boolean;

  @ApiProperty({ example: true })
  isActive!: boolean;
}

export class ProductOverviewStockBreakdownDto {
  @ApiProperty({ example: 12 })
  totalStock!: number;

  @ApiProperty({ example: 12 })
  availableStock!: number;

  @ApiProperty({ example: 0 })
  reservedStock!: number;

  @ApiProperty({ example: 1 })
  lowStockCount!: number;
}

export class ProductOverviewResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'], example: 'ACTIVE' })
  status!: string;

  @ApiProperty({ type: Date })
  createdAt!: Date;

  @ApiPropertyOptional({ type: ProductThumbnailResponseDto })
  thumbnail?: ProductThumbnailResponseDto | null;

  @ApiProperty({ type: [ProductOverviewVariantDto] })
  variants!: ProductOverviewVariantDto[];

  @ApiProperty({ type: ProductOverviewStockBreakdownDto })
  stockBreakdown!: ProductOverviewStockBreakdownDto;
}

export class ProductDetailResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: 'monstera-deliciosa' })
  slug!: string;

  @ApiProperty({
    enum: ['plant', 'pot', 'seed', 'fertilizer'],
    example: 'plant',
  })
  productType!: string;

  @ApiProperty({ enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'], example: 'ACTIVE' })
  status!: string;

  @ApiPropertyOptional({ type: ProductThumbnailResponseDto })
  thumbnail?: ProductThumbnailResponseDto;

  @ApiPropertyOptional({
    type: [Object],
    example: [
      {
        locale: 'en',
        name: 'Monstera Deliciosa',
        description: '...',
        shortDescription: '...',
      },
    ],
  })
  translations?: Array<{
    locale: string;
    name: string;
    description: string | null;
    shortDescription: string | null;
  }>;

  @ApiPropertyOptional({
    type: [Object],
    example: [
      {
        id: 'var-1',
        sku: 'ALBO-MED-001',
        price: '4500.00',
        inventoryCount: 8,
        lowStockThreshold: 3,
        isBase: true,
        isActive: true,
      },
    ],
  })
  variants?: Array<{
    id: string;
    sku: string | null;
    price: string;
    inventoryCount: number;
    lowStockThreshold: number;
    isBase: boolean;
    isActive: boolean;
  }>;

  @ApiPropertyOptional({
    type: Object,
    example: {
      totalStock: 12,
      availableStock: 12,
      reservedStock: 0,
      lowStockCount: 1,
    },
  })
  stockBreakdown?: {
    totalStock: number;
    availableStock: number;
    reservedStock: number;
    lowStockCount: number;
  };

  @ApiProperty({ type: Date })
  createdAt!: Date;

  @ApiProperty({ type: Date })
  updatedAt!: Date;
}

export class ProductListItemResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: 'monstera-deliciosa' })
  slug!: string;

  @ApiProperty({
    enum: ['plant', 'pot', 'seed', 'fertilizer'],
    example: 'plant',
  })
  productType!: string;

  @ApiProperty({ enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'], example: 'ACTIVE' })
  status!: string;

  @ApiPropertyOptional({ type: ProductThumbnailResponseDto })
  thumbnail?: ProductThumbnailResponseDto;

  @ApiPropertyOptional({ example: 'Monstera Deliciosa' })
  name?: string;

  @ApiPropertyOptional({ example: 'A popular tropical houseplant' })
  shortDescription?: string;

  @ApiPropertyOptional({ example: '29.99' })
  price?: string;

  @ApiProperty({ example: 50 })
  inventoryCount!: number;

  @ApiProperty({ type: Date })
  createdAt!: Date;

  @ApiProperty({ type: Date })
  updatedAt!: Date;
}
