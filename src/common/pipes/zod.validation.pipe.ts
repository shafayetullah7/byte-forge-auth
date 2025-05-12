import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

import { ZodError, ZodType } from 'zod';
import { ZodValidationException } from '../exceptions/zod.validation.exception';

const isZodSchema = (value: unknown): value is ZodType => {
  return value instanceof ZodType;
};

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): any {
    const { metatype } = metadata;

    console.log(metadata, metatype);

    if (!metatype) {
      console.log('here');
      return value;
    }

    if (!value) {
      if (metadata.type) {
        throw new BadRequestException(`${metadata.type} is required`);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const schema = (metatype as { schema?: any })?.schema;

    if (!schema || !isZodSchema(schema)) {
      console.log('here');
      return value;
    }

    try {
      return schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ZodValidationException(error);
      }
      throw error;
    }
  }
}
