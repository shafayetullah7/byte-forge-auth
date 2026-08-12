import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryMovementTypeEnum } from '@/_db/drizzle/enum';

export class VariantInventoryDto {
  @ApiProperty({ example: 'inv-uuid' })
  inventoryId!: string;

  @ApiProperty({ example: 'var-uuid' })
  variantId!: string;

  @ApiPropertyOptional({ example: 'ALBO-MED-001' })
  sku?: string | null;

  @ApiPropertyOptional({ example: 'Mature Albo (15cm)' })
  variantName?: string | null;

  @ApiProperty({ example: '4500.00' })
  price!: string;

  @ApiProperty({ example: 8 })
  quantity!: number;

  @ApiProperty({ example: 2 })
  reservedQuantity!: number;

  @ApiProperty({ example: 6 })
  availableQuantity!: number;

  @ApiProperty({ example: 3 })
  lowStockThreshold!: number;

  @ApiProperty({ example: true })
  trackInventory!: boolean;

  @ApiProperty({ example: false })
  allowBackorder!: boolean;

  @ApiProperty({
    enum: ['in_stock', 'low_stock', 'out_of_stock'],
    example: 'in_stock',
  })
  status!: string;

  @ApiProperty({ type: Date })
  lastStockUpdate!: Date;
}

export class InventoryDetailResponseDto {
  @ApiProperty({ example: 'prod-uuid' })
  productId!: string;

  @ApiProperty({ example: 'Monstera Deliciosa Albo' })
  productName!: string;

  @ApiProperty({ example: 'monstera-deliciosa-albo' })
  productSlug!: string;

  @ApiProperty({ example: 12 })
  totalStock!: number;

  @ApiProperty({ example: 3 })
  reservedStock!: number;

  @ApiProperty({ example: 9 })
  availableStock!: number;

  @ApiProperty({ example: 1 })
  lowStockCount!: number;

  @ApiProperty({ example: 0 })
  outOfStockCount!: number;

  @ApiProperty({ type: [VariantInventoryDto] })
  variants!: VariantInventoryDto[];
}

export class InventoryMovementDto {
  @ApiProperty({ example: 'mov-uuid' })
  id!: string;

  @ApiProperty({ example: 'inv-uuid' })
  inventoryId!: string;

  @ApiProperty({ example: 'var-uuid' })
  variantId!: string;

  @ApiPropertyOptional({ example: 'ALBO-MED-001' })
  variantSku?: string | null;

  @ApiPropertyOptional({ example: 'Mature Albo (15cm)' })
  variantName?: string | null;

  @ApiProperty({ enum: InventoryMovementTypeEnum })
  movementType!: InventoryMovementTypeEnum;

  @ApiProperty({ example: 5 })
  quantityChange!: number;

  @ApiProperty({ example: 7 })
  previousQuantity!: number;

  @ApiProperty({ example: 12 })
  newQuantity!: number;

  @ApiProperty({ example: 0 })
  previousReserved!: number;

  @ApiProperty({ example: 0 })
  newReserved!: number;

  @ApiPropertyOptional({ example: 'purchase_order' })
  referenceType?: string | null;

  @ApiPropertyOptional({ example: 'PO-2026-042' })
  referenceId?: string | null;

  @ApiPropertyOptional({ example: 'New batch received from nursery' })
  reason?: string | null;

  @ApiPropertyOptional({ example: 'user-uuid' })
  createdBy?: string | null;

  @ApiProperty({ type: Date })
  createdAt!: Date;
}

export class InventoryMovementsResponseDto {
  @ApiProperty({ type: [InventoryMovementDto] })
  movements!: InventoryMovementDto[];

  @ApiProperty()
  meta!: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class InventoryOperationResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Stock restocked successfully' })
  message!: string;

  @ApiProperty()
  data!: {
    movement: InventoryMovementDto;
    newQuantity: number;
    newReserved: number;
  };
}
