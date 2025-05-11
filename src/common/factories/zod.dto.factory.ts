import { z, ZodSchema } from 'zod';

export class ZodDtoFactory {
  static create<T extends ZodSchema>(schema: T) {
    class GenerateDto {
      static readonly schema = schema;
      constructor(data: unknown) {
        Object.assign(this, schema.parse(data));
      }
    }

    return GenerateDto as {
      new (data: unknown): z.infer<T>;
      readonly schema: T;
    };
  }
}
