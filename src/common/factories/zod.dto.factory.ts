import { z, ZodSchema } from 'zod';

export interface ZodDto<T extends ZodSchema> {
  new (data: unknown): z.infer<T>;
  readonly schema: T;
}

export class ZodDtoFactory {
  static create<T extends ZodSchema>(schema: T) {
    class GenerateDto {
      static readonly schema = schema;
      constructor(data: unknown) {
        Object.assign(this, schema.parse(data));
      }
    }

    return GenerateDto as ZodDto<T>;
  }
}
