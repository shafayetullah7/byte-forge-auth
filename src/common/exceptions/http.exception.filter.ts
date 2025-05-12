import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    console.error(exception);
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    if (!(exception instanceof HttpException)) {
      response.status(500).json({
        success: false,
        status: 500,
        message: 'Internal server error',
        description:
          (exception as { message?: unknown })?.message &&
          typeof (exception as { message?: unknown })?.message === 'string'
            ? [(exception as { message?: unknown }).message]
            : [],
        timestamp: new Date().toISOString(),
        path: request.url,
      });
      return;
    }

    const status = exception?.getStatus() || 500;
    const message = exception.message || 'Internal server error';
    const description: string[] = [];

    const errorResponse = exception.getResponse();
    if (typeof errorResponse === 'object') {
      const errorDescription: unknown = (errorResponse as { description?: any })
        ?.description;
      if (errorDescription && typeof errorDescription === 'string') {
        description.push(errorDescription);
      } else if (Array.isArray(errorDescription)) {
        errorDescription.forEach((des) => {
          if (typeof des === 'string') description.push(des);
        });
      }
    }

    response.status(status).send({
      success: false,
      status,
      message,
      description,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
