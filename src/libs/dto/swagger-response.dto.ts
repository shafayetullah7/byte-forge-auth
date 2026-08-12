import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Error detail for validation errors
 */
export class ErrorDetailDto {
  @ApiProperty({
    example: 'email',
    description: 'Field name that caused the error',
  })
  field!: string;

  @ApiProperty({
    example: 'Invalid email format',
    description: 'Error message',
  })
  message!: string;
}

/**
 * Standard error response schema
 */
export class ErrorResponseDto {
  @ApiProperty({ example: 400, description: 'HTTP status code' })
  statusCode!: number;

  @ApiProperty({ example: 'Validation failed', description: 'Error message' })
  message!: string;

  @ApiPropertyOptional({
    example: 'VALIDATION_ERROR',
    description: 'Error code for programmatic handling',
  })
  errorCode?: string;

  @ApiPropertyOptional({
    type: [ErrorDetailDto],
    description: 'Detailed validation errors',
  })
  details?: ErrorDetailDto[];

  @ApiPropertyOptional({
    example: '2026-03-11T10:00:00Z',
    description: 'Timestamp of the error',
  })
  timestamp?: string;

  @ApiPropertyOptional({
    example: 'POST /api/shops',
    description: 'Request path',
  })
  path?: string;
}

/**
 * Standard paginated response wrapper
 */
export class PaginatedResponseDto<T = any> {
  @ApiProperty({ type: [Object], description: 'Array of data items' })
  data!: T[];

  @ApiProperty({ example: 1, description: 'Current page number (1-indexed)' })
  page!: number;

  @ApiProperty({ example: 10, description: 'Items per page' })
  limit!: number;

  @ApiProperty({ example: 100, description: 'Total number of items' })
  total!: number;

  @ApiProperty({ example: 10, description: 'Total number of pages' })
  totalPages!: number;

  @ApiProperty({ example: true, description: 'Whether there is a next page' })
  hasNext!: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether there is a previous page',
  })
  hasPrev!: boolean;
}

/**
 * Standard success response wrapper
 */
export class SuccessResponseDto<T = any> {
  @ApiProperty({ description: 'Success message' })
  message!: string;

  @ApiPropertyOptional({ description: 'Response data' })
  data?: T;
}
