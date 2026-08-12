import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { PaginatedResponseDto } from '../dto/swagger-response.dto';

/**
 * Standard authentication decorator for protected endpoints
 */
export const ApiAuth = () => applyDecorators(ApiBearerAuth('JWT-auth'));

/**
 * Decorator for paginated responses
 * @param type The DTO type for items in the data array
 */
export const ApiPaginatedResponse = <T>(type: Type<T>) =>
  applyDecorators(
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(type) },
              },
            },
          },
        ],
      },
    }),
  );

/**
 * Decorator for standard OK response with type
 */
export const ApiOkResponseTyped = <T>(type: Type<T>, description?: string) =>
  ApiOkResponse({
    type,
    description: description || 'Operation successful',
  });

/**
 * Decorator for standard Created response with type
 */
export const ApiCreatedResponseTyped = <T>(
  type: Type<T>,
  description?: string,
) =>
  ApiCreatedResponse({
    type,
    description: description || 'Resource created successfully',
  });
