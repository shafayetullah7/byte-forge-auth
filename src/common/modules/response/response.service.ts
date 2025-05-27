import { Injectable } from '@nestjs/common';
import { SuccessResponse } from './dto/success.response.dto';
import { ErrorResponse } from './dto/error.response.dto';
import { ErrorCode } from './dto/error.schema';
import { PaginatedSuccessResponse } from './dto/paginated.success.response.dto';
import { WarningDto } from './dto/response.warning.schema';

@Injectable()
export class ResponseService {
  success<T>(payload: {
    message: string;
    data: T;
    warnings?: WarningDto[];
  }): SuccessResponse<T> {
    return {
      success: true,
      message: payload.message,
      data: payload.data,
      warnings: payload.warnings,
      timestamp: new Date().toISOString(),
    };
  }

  error(payload: {
    message: string;
    code?: ErrorCode;
    details?: string;
    warnings?: WarningDto[];
    validationErrors?: any[];
  }): ErrorResponse {
    return {
      success: false,
      message: payload.message,
      warnings: payload.warnings,
      error: {
        code: payload.code,
        details: payload.details,
        validationErrors: payload.validationErrors,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // warning({
  //   message,
  //   warnings,
  //   statusCode = 200,
  // }: {
  //   message: string;
  //   warnings: Warning[];
  //   statusCode?: number;
  // }): SuccessResponse<null> {
  //   return {
  //     success: true,
  //     statusCode,
  //     message,
  //     data: null,
  //     warnings,
  //     timestamp: new Date().toISOString(),
  //   };
  // }

  // successWithWarnings<T>({
  //   message,
  //   data,
  //   warnings,
  //   meta,
  //   statusCode = 200,
  // }: {
  //   message: string;
  //   data: T;
  //   warnings: Warning[];
  //   meta?: any;
  //   statusCode?: number;
  // }): SuccessResponse<T> {
  //   return {
  //     success: true,
  //     statusCode,
  //     message,
  //     data,
  //     warnings,
  //     meta,
  //     timestamp: new Date().toISOString(),
  //   };
  // }

  paginated<T>(payload: {
    message: string;
    data: T[];
    warnings?: WarningDto[];
    meta: { page: number; limit: number; total: number };
  }): PaginatedSuccessResponse<T[]> {
    const {
      meta: { limit, page, total },
    } = payload;

    return {
      success: true,
      message: payload.message,
      data: payload.data,
      warnings: payload.warnings,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
