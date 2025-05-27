import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Response } from 'express';
import { CustomException } from '../exceptions/custom.exception';
import { ResponseService } from '../modules/response/response.service';
import { ErrorCode } from '../modules/response/dto/error.schema';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly responseService: ResponseService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Handle custom exceptions
    if (exception instanceof CustomException) {
      const { statusCode, message, errorCode, details } = exception;
      return response.status(statusCode).json(
        this.responseService.error({
          code: errorCode,
          message,
          details: details || message || 'Unknown error',
        }),
      );
    }

    // Handle NestJS HTTP exceptions
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      // const exceptionResponse = exception.getResponse();

      return response.status(status).json(
        this.responseService.error({
          code: this.getErrorCode(exception, status),
          message: this.getErrorMessage(exception, status),
          details: exception.message,
        }),
      );
    }

    // Fallback for unhandled errors
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
      this.responseService.error({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      }),
    );
  }

  private getErrorCode(
    exception: HttpException,
    status: HttpStatus,
  ): ErrorCode {
    if (exception instanceof BadRequestException)
      return ErrorCode.VALIDATION_ERROR;
    if (exception instanceof UnauthorizedException)
      return ErrorCode.UNAUTHORIZED;
    if (exception instanceof ForbiddenException) return ErrorCode.FORBIDDEN;
    if (exception instanceof NotFoundException) return ErrorCode.NOT_FOUND;
    if (exception instanceof ConflictException) return ErrorCode.CONFLICT;

    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.CONFLICT;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.TOO_MANY_REQUESTS;
      case HttpStatus.METHOD_NOT_ALLOWED:
        return ErrorCode.METHOD_NOT_ALLOWED;
      default:
        return ErrorCode.INTERNAL_SERVER_ERROR;
    }
  }

  private getErrorMessage(
    exception: HttpException,
    status: HttpStatus,
  ): string {
    if (exception.message) return exception.message;

    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad request';
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized';
      case HttpStatus.FORBIDDEN:
        return 'Forbidden';
      case HttpStatus.NOT_FOUND:
        return 'Not found';
      case HttpStatus.CONFLICT:
        return 'Conflict';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'Too many requests';
      case HttpStatus.METHOD_NOT_ALLOWED:
        return 'Method not allowed';
      default:
        return 'Internal server error';
    }
  }

  // private getValidationErrors(exceptionResponse: any) {
  //   if (Array.isArray(exceptionResponse?.message)) {
  //     return exceptionResponse.message.map((err) => ({
  //       field: err.property || 'unknown',
  //       message: Object.values(err.constraints || {}).join(', '),
  //     }));
  //   }
  //   return undefined;
  // }

  // private getSafeDetails(exceptionResponse: any, status: number) {
  //   if (status >= 500 && process.env.NODE_ENV === 'production') {
  //     return 'Internal server error';
  //   }
  //   return typeof exceptionResponse === 'object'
  //     ? exceptionResponse.message || exceptionResponse.error
  //     : exceptionResponse;
  // }
}
