// src/config/env.schema.ts
import { z } from 'zod';

export const envSchema = z.object({
  // === Application Settings ===
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number(),
  APP_NAME: z.string(),

  // === Frontend (deep links in transactional emails) ===
  FRONTEND_URL: z.string().url(),

  // === Database ===
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  DB_SSL: z.enum(['true', 'false']).default('false'),

  // DATABASE_URL: z.string().url().optional(),
  // === Docker Compose ===
  COMPOSE_PROJECT_NAME: z.string(),
  APP_EXTERNAL_PORT: z.coerce.number(),
  DB_EXTERNAL_PORT: z.coerce.number(),
  SALT_ROUNDS: z.coerce.number(),

  // Email / SMTP
  MAIL_PROVIDER: z.enum(['gmail', 'smtp', 'console']),
  MAIL_HOST: z.string(),
  MAIL_PORT: z.coerce.number(),
  MAIL_SECURE: z.string(),
  MAIL_USER: z.string().optional(),
  MAIL_PASSWORD: z.string().optional(),
  MAIL_FROM_NAME: z.string(),
  MAIL_FROM_EMAIL: z.string().email(),

  // === Cloudinary ===
  CLOUDINARY_CLOUD_NAME: z.string().nonempty().max(255),
  CLOUDINARY_API_KEY: z.string().nonempty().max(255),
  CLOUDINARY_API_SECRET: z.string().nonempty().max(255),

  // === JWT Secrets ===
  JWT_SECRET_RESET_REQUEST: z.string().min(32),
  JWT_SECRET_RESET_ACCESS: z.string().min(32),

  // === Session & Cookie ===
  SESSION_MAX_AGE: z.coerce.number(),
  COOKIE_DOMAIN: z.string(),

  // === Admin JWT ===
  JWT_ADMIN_ACCESS_SECRET: z.string().min(32),
  JWT_ADMIN_ACCESS_EXP: z
    .string()
    .regex(
      /^\d+(s|m|h|d|w|y|)$|^\d+$/i,
      'Invalid duration format (e.g. 15m, 1h, 7d)',
    ),
  JWT_ADMIN_REFRESH_SECRET: z.string().min(32),
  JWT_ADMIN_REFRESH_EXP: z
    .string()
    .regex(
      /^\d+(s|m|h|d|w|y|)$|^\d+$/i,
      'Invalid duration format (e.g. 15m, 1h, 7d)',
    ),

  // === User JWT ===
  JWT_USER_ACCESS_SECRET: z.string().min(32),
  JWT_USER_ACCESS_EXP: z
    .string()
    .regex(
      /^\d+(s|m|h|d|w|y|)$|^\d+$/i,
      'Invalid duration format (e.g. 15m, 1h, 7d)',
    ),
  JWT_USER_REFRESH_SECRET: z.string().min(32),
  JWT_USER_REFRESH_EXP: z
    .string()
    .regex(
      /^\d+(s|m|h|d|w|y|)$|^\d+$/i,
      'Invalid duration format (e.g. 15m, 1h, 7d)',
    ),

  // === Plant AI (optional — feature off when unset) ===
  GEMINI_API_KEY: z.string().min(1).optional(),
  PLANT_AI_ENABLED: z.enum(['true', 'false']).default('false'),
  GEMINI_MODEL: z.string().default('gemini-3.6-flash'),
  PLANT_AI_RATE_LIMIT_PER_DAY: z.coerce.number().int().positive().default(20),
  PLANT_AI_MAX_IMAGE_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(5 * 1024 * 1024),
  PLANT_AI_MAX_OUTPUT_TOKENS: z.coerce
    .number()
    .int()
    .positive()
    .default(8192),
  PLANT_AI_GEMINI_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(120_000),

  // === Seller subscription (optional — enforcement off by default) ===
  SUBSCRIPTION_ENFORCEMENT_ENABLED: z.enum(['true', 'false']).default('false'),

  // === Stripe (optional — seller subscription billing; Phases 7+) ===
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
});
// .transform((data) => {
//   const dbUrl = data.DATABASE_URL;
//   if (dbUrl) return data;
//   const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = data;
//   return {
//     ...data,
//     DATABASE_URL: `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`,
//   };
// });

export type AppEnv = z.infer<typeof envSchema>;
