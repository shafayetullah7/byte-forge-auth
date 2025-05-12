import { HttpException, HttpStatus } from '@nestjs/common';
import { ZodError } from 'zod';

export class ZodValidationException extends HttpException {
  constructor(error: ZodError) {
    console.log(error);
    super(
      {
        status: HttpStatus.BAD_REQUEST,
        message: 'Validation Error',
        description: error.errors.map((err) => {
          return `${
            err.path.length > 0 ? err.path[err.path.length - 1] : 'unknown'
          }: ${err.message}`;
        }),
        errors: error.errors.map((err) => ({
          path: err.path.join('.'),
          code: err.code,
          message: err.message,
        })),
        timestamp: new Date().toISOString(),
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
