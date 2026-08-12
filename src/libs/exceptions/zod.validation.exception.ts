import { HttpException, HttpStatus } from '@nestjs/common';
import { ZodError } from 'zod';

export class ZodValidationException extends HttpException {
  constructor(error: ZodError) {
    console.log(error);
    super(
      {
        status: HttpStatus.BAD_REQUEST,
        message: 'Validation Error',
        description: error.issues.map((issue) => {
          return issue.message;
          // return `${
          //   issue.path.length > 0
          //     ? issue.path[issue.path.length - 1]
          //     : 'unknown'
          // }: ${err.message}`;
        }),
        errors: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          code: issue.code,
          message: issue.message,
        })),
        timestamp: new Date().toISOString(),
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
