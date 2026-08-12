import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

/**
 * Standard pagination query parameters
 */
export const ApiPagination = () =>
  applyDecorators(
    ApiQuery({
      name: 'page',
      description: 'Page number (1-indexed)',
      required: false,
      type: Number,
      example: 1,
      default: 1,
      minimum: 1,
    }),
    ApiQuery({
      name: 'limit',
      description: 'Items per page',
      required: false,
      type: Number,
      example: 10,
      default: 10,
      minimum: 1,
      maximum: 100,
    }),
  );

/**
 * Sorting query parameters
 * @param allowedFields Array of allowed sort field names
 */
export const ApiSorting = (allowedFields: string[] = ['createdAt']) =>
  applyDecorators(
    ApiQuery({
      name: 'sortBy',
      description: `Field to sort by (${allowedFields.join(', ')})`,
      required: false,
      type: String,
      example: allowedFields[0],
      enum: allowedFields,
    }),
    ApiQuery({
      name: 'sortOrder',
      description: 'Sort direction',
      required: false,
      type: String,
      example: 'desc',
      enum: ['asc', 'desc'],
      default: 'desc',
    }),
  );

/**
 * Basic search/filter query parameters
 */
export const ApiFiltering = () =>
  applyDecorators(
    ApiQuery({
      name: 'search',
      description: 'Search term for text fields',
      required: false,
      type: String,
      example: 'monstera',
    }),
  );

/**
 * Status filter query parameter
 * @param statuses Array of allowed status values
 */
export const ApiStatusFilter = (statuses: string[] = []) =>
  applyDecorators(
    ApiQuery({
      name: 'status',
      description: 'Filter by status',
      required: false,
      type: String,
      enum: statuses,
    }),
  );

/**
 * Combined pagination, sorting, and filtering decorators
 * @param allowedSortFields Array of allowed sort field names
 * @param statuses Array of allowed status values
 */
export const ApiListQuery = (
  allowedSortFields: string[] = ['createdAt'],
  statuses?: string[],
) =>
  applyDecorators(
    ApiPagination(),
    ApiSorting(allowedSortFields),
    ApiFiltering(),
    statuses ? ApiStatusFilter(statuses) : applyDecorators(),
  );
