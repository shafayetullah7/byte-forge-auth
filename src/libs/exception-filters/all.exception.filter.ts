// src/libs/exception-filters/all-exceptions.filter.ts
import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ZodError } from 'zod';
import { DrizzleError } from 'drizzle-orm';
import { Response } from 'express';
import { ResponseService } from '../modules/response/response.service';
import { CustomException } from '../exceptions/custom.exception';
import { ErrorCode } from '../modules/response/dto/error.schema';
import { ResponseValidationError } from '../modules/response/dto/response.validation.error.schema';
import { AppEnvService } from '../../_config/app-env/app-env.service';
import { ZodValidationException } from 'nestjs-zod';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    private readonly responseService: ResponseService,
    private readonly appEnvService: AppEnvService,
    private readonly i18n: I18nService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const errorResponse = this.handleException(exception);

    return response.status(errorResponse.statusCode).json(errorResponse);
  }

  private handleException(exception: unknown) {
    const i18n = I18nContext.current();
    const lang = i18n ? i18n.lang : 'en';

    // 1. Zod Validation Errors
    if (exception instanceof ZodValidationException) {
      const validationErrors = this.formatZodErrors(exception, lang);
      const zodError = exception.getZodError() as ZodError;
      this.logger.error(
        `Validation Error [${JSON.stringify(zodError.issues)}]`,
      );
      return this.responseService.error({
        statusCode: HttpStatus.BAD_REQUEST,
        code: ErrorCode.VALIDATION_ERROR,
        message: this.i18n.t('message.validation.error', { lang }),
        details: this.i18n.t('message.validation.details', { lang }),
        validationErrors,
      });
    }

    // 2. NestJS BadRequestException (often from ClassValidator)
    if (exception instanceof BadRequestException) {
      return this.handleBadRequestException(exception, lang);
    }

    // 3. Drizzle Database Errors
    const pgCode = this.readPostgresErrorCode(exception);
    if (exception instanceof DrizzleError || pgCode) {
      const error = exception as {
        code?: string;
        originalError?: { code?: string };
        message?: string;
        stack?: string;
        detail?: string;
        cause?: { code?: string; message?: string; detail?: string };
      };

      this.logger.error(
        `Database Error [${pgCode || 'unknown'}]: ${error.message}`,
        error.stack,
      );

      // Map unique_violation (23505) to CONFLICT
      if (pgCode === '23505') {
        return this.responseService.error({
          statusCode: HttpStatus.CONFLICT,
          code: ErrorCode.CONFLICT,
          message: this.i18n.t('message.error.conflict', { lang }),
          details: this.isProduction()
            ? this.i18n.t('message.error.conflictDetails', { lang })
            : error.detail || error.message,
        });
      }

      return this.responseService.error({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: ErrorCode.DATABASE_ERROR,
        message: this.i18n.t('message.error.database', { lang }),
        details: this.isProduction()
          ? this.i18n.t('message.error.internal', { lang })
          : error.message,
        validationErrors: [],
      });
    }

    // 4. Custom Exceptions
    if (exception instanceof CustomException) {
      return this.responseService.error({
        statusCode: exception.statusCode, // ✅ Use explicit status from CustomException
        code: exception.errorCode,
        message: exception.message, // TODO: Consider if CustomExceptions should store i18n keys
        details: exception.details || exception.message || 'Unknown error',
      });
    }

    // 5. NestJS HTTP Exceptions
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return this.responseService.error({
        statusCode: status, // ✅ Use status from HttpException
        code: this.getErrorCode(exception, status),
        message: this.getErrorMessage(exception, status, lang),
        details: exception.message,
      });
    }

    // 6. Unknown / Internal Server Error
    this.logger.error(
      `Unexpected Error: ${(exception as Error).message}`,
      (exception as Error).stack,
    );
    return this.responseService.error({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: this.i18n.t('message.error.internal', { lang }),
      details: this.isProduction()
        ? this.i18n.t('message.error.internal', { lang })
        : (exception as Error).message,
    });
  }

  private handleBadRequestException(
    exception: BadRequestException,
    lang: string,
  ) {
    const res = exception.getResponse();
    let validationErrors: ResponseValidationError[] = [];

    if (res instanceof ZodValidationException) {
      validationErrors = this.formatZodErrors(res, lang);
      return this.responseService.error({
        statusCode: HttpStatus.BAD_REQUEST,
        code: ErrorCode.VALIDATION_ERROR,
        message: this.i18n.t('message.validation.error', { lang }),
        details: this.i18n.t('message.validation.details', { lang }),
        validationErrors,
      });
    }

    if (Array.isArray(res)) {
      validationErrors = (
        res as Array<{ property: string; constraints?: Record<string, string> }>
      ).map((err) => ({
        field: err.property,
        message: err.constraints
          ? Object.values(err.constraints).join(', ')
          : 'Unknown validation error',
      }));
    } else if (
      typeof res === 'object' &&
      res !== null &&
      'message' in res &&
      Array.isArray((res as { message: string }).message)
    ) {
      validationErrors = (res as { message: string[] }).message.map((msg) => ({
        field: 'unknown_field',
        message: msg,
      }));
    }

    return this.responseService.error({
      statusCode: HttpStatus.BAD_REQUEST,
      code: ErrorCode.VALIDATION_ERROR,
      message: exception.message,
      details: this.i18n.t('message.validation.details', { lang }),
      validationErrors,
    });
  }

  private isProduction(): boolean {
    return this.appEnvService.NODE_ENV === 'production';
  }

  private getHttpStatus(code: ErrorCode): number {
    switch (code) {
      case ErrorCode.BAD_REQUEST:
      case ErrorCode.VALIDATION_ERROR:
        return HttpStatus.BAD_REQUEST;
      case ErrorCode.UNAUTHORIZED:
        return HttpStatus.UNAUTHORIZED;
      case ErrorCode.FORBIDDEN:
        return HttpStatus.FORBIDDEN;
      case ErrorCode.NOT_FOUND:
        return HttpStatus.NOT_FOUND;
      case ErrorCode.CONFLICT:
        return HttpStatus.CONFLICT;
      case ErrorCode.TOO_MANY_REQUESTS:
        return HttpStatus.TOO_MANY_REQUESTS;
      case ErrorCode.METHOD_NOT_ALLOWED:
        return HttpStatus.METHOD_NOT_ALLOWED;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
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
    lang: string,
  ): string {
    if (exception.message) return exception.message;

    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return this.i18n.t('message.validation.error', { lang });
      case HttpStatus.UNAUTHORIZED:
        return this.i18n.t('message.error.unauthorized', { lang });
      case HttpStatus.FORBIDDEN:
        return this.i18n.t('message.error.forbidden', { lang });
      case HttpStatus.NOT_FOUND:
        return this.i18n.t('message.error.notFound', { lang });
      case HttpStatus.CONFLICT:
        return this.i18n.t('message.error.conflict', { lang });
      default:
        return this.i18n.t('message.error.internal', { lang });
    }
  }

  private readPostgresErrorCode(error: unknown): string | undefined {
    let current: unknown = error;

    for (let depth = 0; depth < 4 && current; depth += 1) {
      if (typeof current !== 'object' || current === null) {
        return undefined;
      }

      const record = current as {
        code?: string;
        originalError?: { code?: string };
        cause?: unknown;
      };

      const code = record.code || record.originalError?.code;
      if (code) {
        return code;
      }

      current = record.cause;
    }

    return undefined;
  }

  private formatZodErrors(
    zodError: ZodValidationException,
    lang: string,
  ): ResponseValidationError[] {
    const error = zodError.getZodError() as ZodError;
    // console.log('zodError', zodError);
    return error.issues.map((issue) => {
      let args: Record<string, number> = {};
      if (issue.code === 'too_small') {
        args = { count: (issue as { minimum?: number }).minimum! };
      } else if (issue.code === 'too_big') {
        args = { count: (issue as { maximum?: number }).maximum! };
      }

      return {
        field: issue.path.join('.') || 'unknown_field',
        message: this.i18n.t(issue.message, { lang, args }),
        code: issue.code,
      };
    });
  }
}
