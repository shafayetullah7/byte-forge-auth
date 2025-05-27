import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { ZodError } from 'zod';
import { ResponseService } from '../modules/response/response.service';
import { Request, Response } from 'express';
import { ResponseValidationError } from '../modules/response/dto/response.validation.error.schema';
import { ErrorCode } from '../modules/response/dto/error.schema';

@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
  constructor(private readonly responseService: ResponseService) {}

  catch(exception: ZodError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const validationErrors = this.formatZodErrors(exception);
    const errorResponse = this.responseService.error({
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Please review the provided data',
      details: 'Check the validationErrors array for details',
      validationErrors,
    });

    response.status(HttpStatus.BAD_REQUEST).send(errorResponse);
  }

  private formatZodErrors(zodError: ZodError): ResponseValidationError[] {
    return zodError.errors.map((error) => {
      return {
        field: error.path.join('.') || 'unknown_field',
        message: error.message,
      };
    });
  }
}
