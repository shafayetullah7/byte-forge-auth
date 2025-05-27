import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DrizzleError } from 'drizzle-orm';
import { ResponseService } from '../modules/response/response.service';
import { ErrorCode } from '../modules/response/dto/error.schema';

@Catch(DrizzleError)
export class DrizzleExceptionFilter implements ExceptionFilter {
  private readonly sensitiveFields = ['password', 'token', 'credit_card'];

  constructor(private readonly responseService: ResponseService) {}

  catch(exception: DrizzleError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { message, name, cause, stack } = exception;

    const errorResponse = this.responseService.error({
      code: ErrorCode.DATABASE_ERROR,
      message: 'Something went wrong',
      details: message,
      validationErrors: [],
    });

    // 1. Classify error
    // const { errorCode, httpStatus, message } = this.classifyError(exception);

    // 2. Send standardized response
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(errorResponse);
  }

  //   private classifyError(error: unknown): {
  //     errorCode: string;
  //     httpStatus: number;
  //     message: string;
  //   } {
  //     if (this.isDatabaseError(error)) {
  //       switch (error.code) {
  //         case '23505':
  //           return {
  //             errorCode: 'CONFLICT',
  //             httpStatus: 409,
  //             message: 'Resource exists',
  //           };
  //         case '23502':
  //           return {
  //             errorCode: 'NULL_CONSTRAINT',
  //             httpStatus: 400,
  //             message: 'Null violation',
  //           };
  //         case '23503':
  //           return {
  //             errorCode: 'RELATION_VIOLATION',
  //             httpStatus: 400,
  //             message: 'Invalid reference',
  //           };
  //       }
  //     }
  //     return {
  //       errorCode: 'DATABASE_ERROR',
  //       httpStatus: 500,
  //       message: 'Database operation failed',
  //     };
  //   }

  //   private isDatabaseError(error: unknown): error is DatabaseError {
  //     return typeof error === 'object' && error !== null && 'code' in error;
  //   }

  //   private getSafeDetails(error: unknown): string | undefined {
  //     if (process.env.NODE_ENV === 'production') return undefined;
  //     return error instanceof Error ? error.message : String(error);
  //   }

  //   private getValidationErrors(
  //     error: unknown,
  //   ): Array<{ field: string; message: string }> | undefined {
  //     if (!this.isDatabaseError(error)) return undefined;

  //     switch (error.code) {
  //       case '23505': // Unique
  //         return [{ field: 'unknown', message: 'Value must be unique' }];
  //       case '23502': // Null
  //         return [{ field: 'unknown', message: 'Field cannot be null' }];
  //       default:
  //         return undefined;
  //     }
  //   }
}
