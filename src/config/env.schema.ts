// src/config/env.schema.ts
import { z } from 'zod';

export const envSchema = z
  .object({
    // === Application Settings ===
    NODE_ENV: z.enum(['development', 'test', 'production']),
    PORT: z.coerce.number().default(3000),
    APP_NAME: z.string().default('my-nest-app'),

    // === Database ===
    DB_HOST: z.string(),
    DB_PORT: z.coerce.number().default(5432),
    DB_USER: z.string(),
    DB_PASSWORD: z.string(),
    DB_NAME: z.string(),

    DATABASE_URL: z.string().url().optional(),
    // === Docker Compose ===
    COMPOSE_PROJECT_NAME: z.string().default('myapp'),
    APP_EXTERNAL_PORT: z.coerce.number().default(3000),
    DB_EXTERNAL_PORT: z.coerce.number().default(5432),
    SALT_ROUNDS: z.coerce.number().default(10),
  })
  .transform((data) => {
    const dbUrl = data.DATABASE_URL;
    if (dbUrl) return data;
    const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = data;
    return {
      ...data,
      DATABASE_URL: `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`,
    };
  });
