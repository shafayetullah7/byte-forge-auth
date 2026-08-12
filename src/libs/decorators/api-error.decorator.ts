import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

/**
 * Generic error response decorator
 */
export const ApiErrorResponse = (
  status: number,
  description: string,
  errorCode?: string,
  example?: Record<string, any>,
) => {
  const defaultExample = {
    statusCode: status,
    message: description,
    errorCode: errorCode || `${status}_ERROR`,
    timestamp: new Date().toISOString(),
  };

  return ApiResponse({
    status,
    description,
    schema: {
      example: example || defaultExample,
    },
  });
};

/**
 * 400 Bad Request - Validation failed
 */
export const ApiBadRequestResponse = (errorCode?: string) =>
  ApiErrorResponse(400, 'Validation failed', errorCode || 'VALIDATION_ERROR', {
    statusCode: 400,
    message: 'Validation failed',
    errorCode: errorCode || 'VALIDATION_ERROR',
    details: [
      { field: 'email', message: 'Invalid email format' },
      { field: 'password', message: 'Password must be at least 8 characters' },
    ],
  });

/**
 * 401 Unauthorized - Authentication required
 */
export const ApiUnauthorizedResponse = () =>
  ApiErrorResponse(401, 'Authentication required', 'UNAUTHORIZED', {
    statusCode: 401,
    message: 'Authentication required',
    errorCode: 'UNAUTHORIZED',
  });

/**
 * 403 Forbidden - Access denied
 */
export const ApiForbiddenResponse = (message = 'Access denied') =>
  ApiErrorResponse(403, message, 'FORBIDDEN', {
    statusCode: 403,
    message,
    errorCode: 'FORBIDDEN',
  });

/**
 * 404 Not Found - Resource not found
 */
export const ApiNotFoundResponse = (resource = 'Resource') =>
  ApiErrorResponse(404, `${resource} not found`, 'NOT_FOUND', {
    statusCode: 404,
    message: `${resource} not found`,
    errorCode: 'NOT_FOUND',
  });

/**
 * 409 Conflict - Resource already exists
 */
export const ApiConflictResponse = (message: string, errorCode?: string) =>
  ApiErrorResponse(409, message, errorCode || 'CONFLICT', {
    statusCode: 409,
    message,
    errorCode: errorCode || 'CONFLICT',
  });

/**
 * 422 Unprocessable Entity - Business logic validation failed
 */
export const ApiUnprocessableResponse = (message: string, errorCode?: string) =>
  ApiErrorResponse(422, message, errorCode || 'UNPROCESSABLE_ENTITY', {
    statusCode: 422,
    message,
    errorCode: errorCode || 'UNPROCESSABLE_ENTITY',
  });

/**
 * 500 Internal Server Error
 */
export const ApiInternalServerErrorResponse = () =>
  ApiErrorResponse(500, 'Internal server error', 'INTERNAL_ERROR', {
    statusCode: 500,
    message: 'Internal server error',
    errorCode: 'INTERNAL_ERROR',
  });

/**
 * Combined auth error responses (401, 403)
 */
export const ApiAuthErrors = () =>
  applyDecorators(ApiUnauthorizedResponse(), ApiForbiddenResponse());

/**
 * Combined common error responses (400, 401, 404, 500)
 */
export const ApiCommonErrors = (resource?: string) =>
  applyDecorators(
    ApiBadRequestResponse(),
    ApiUnauthorizedResponse(),
    ApiNotFoundResponse(resource),
    ApiInternalServerErrorResponse(),
  );
