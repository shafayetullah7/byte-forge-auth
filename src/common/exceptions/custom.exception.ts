import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../modules/response/dto/error.schema';

export class CustomException extends HttpException {
  constructor(
    message: string,
    public readonly statusCode: HttpStatus,
    public readonly errorCode?: ErrorCode,
    public readonly details?: string,
    public readonly validationErrors?: Array<{
      field: string;
      message: string;
    }>,
  ) {
    super(
      {
        message,
        statusCode,
        errorCode,
        details,
        validationErrors,
      },
      statusCode,
    );
  }

  // Factory methods with flexible status codes
  static create({
    message,
    statusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    errorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    details,
    validationErrors,
  }: {
    message: string;
    statusCode?: HttpStatus;
    errorCode?: ErrorCode;
    details?: string;
    validationErrors?: Array<{ field: string; message: string }>;
  }) {
    return new CustomException(
      message,
      statusCode,
      errorCode,
      details,
      validationErrors,
    );
  }

  // Common error factories with proper typing
  static badRequest({
    message,
    errorCode = ErrorCode.BAD_REQUEST,
    details,
    validationErrors,
  }: {
    message: string;
    errorCode?: ErrorCode;
    details?: string;
    validationErrors?: Array<{ field: string; message: string }>;
  }) {
    return this.create({
      message,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode,
      details,
      validationErrors,
    });
  }

  static unauthorized({
    message,
    errorCode = ErrorCode.UNAUTHORIZED,
    details,
  }: {
    message: string;
    errorCode?: ErrorCode;
    details?: string;
  }) {
    return this.create({
      message,
      statusCode: HttpStatus.UNAUTHORIZED,
      errorCode,
      details,
    });
  }

  static forbidden({
    message,
    errorCode = ErrorCode.FORBIDDEN,
    details,
  }: {
    message: string;
    errorCode?: ErrorCode;
    details?: string;
  }) {
    return this.create({
      message,
      statusCode: HttpStatus.FORBIDDEN,
      errorCode,
      details,
    });
  }

  static notFound({
    message,
    errorCode = ErrorCode.NOT_FOUND,
    details,
  }: {
    message: string;
    errorCode?: ErrorCode;
    details?: string;
  }) {
    return this.create({
      message,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode,
      details,
    });
  }

  // Specialized factories
  static validationFailed({
    message = 'Validation failed',
    validationErrors,
    details,
  }: {
    message?: string;
    validationErrors: Array<{ field: string; message: string }>;
    details?: string;
  }) {
    return this.create({
      message,
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: ErrorCode.VALIDATION_ERROR,
      details,
      validationErrors,
    });
  }

  static databaseError({
    message = 'Database operation failed',
    details,
  }: {
    message?: string;
    details?: string;
  }) {
    return this.create({
      message,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: ErrorCode.DATABASE_ERROR,
      details,
    });
  }
}
