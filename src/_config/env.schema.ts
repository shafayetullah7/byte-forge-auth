// src/config/env.schema.ts
import { z } from 'zod';

export const OIDC_PRODUCTION_REQUIRED_KEYS = [
  'OIDC_ISSUER',
  'OIDC_DEFAULT_RESOURCE',
  'OIDC_CLIENT_ID',
  'OIDC_REDIRECT_URI',
  'OIDC_POST_LOGOUT_REDIRECT_URI',
] as const;

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

  // === JWT Secrets (admin only) ===

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

  // === Admin registration (gatekeeper OTP) ===
  ADMIN_REGISTRATION_OTP_EMAIL: z.string().email(),

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

  // === Seller subscription (Stripe / coupons) ===
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),

  // === OIDC (Aponika Auth) ===
  OIDC_ISSUER: z.string().url().optional(),
  /** Server-side HTTP base for /token and /jwks (Docker/K8s). Defaults to OIDC_ISSUER. */
  OIDC_INTERNAL_ISSUER: z.string().url().optional(),
  OIDC_DEFAULT_RESOURCE: z.string().url().optional(),
  OIDC_CLIENT_ID: z.string().min(1).optional(),
  OIDC_REDIRECT_URI: z.string().url().optional(),
  /** Must match Aponika client post_logout registration exactly (incl. trailing slash). */
  OIDC_POST_LOGOUT_REDIRECT_URI: z.string().url().optional(),
  OIDC_HTTP_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
})
  .superRefine((data, ctx) => {
    if (data.NODE_ENV !== 'production') {
      return;
    }

    for (const key of OIDC_PRODUCTION_REQUIRED_KEYS) {
      if (!data[key]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${key} is required when NODE_ENV=production`,
        });
      }
    }
  })
  .transform((data) => ({
    ...data,
    OIDC_ISSUER: data.OIDC_ISSUER ?? 'http://localhost:3010',
    OIDC_DEFAULT_RESOURCE: data.OIDC_DEFAULT_RESOURCE ?? 'http://localhost:3005',
    OIDC_CLIENT_ID: data.OIDC_CLIENT_ID ?? 'byte-forge-web',
    OIDC_REDIRECT_URI:
      data.OIDC_REDIRECT_URI
      ?? 'http://localhost:3005/api/v1/user/auth/oidc/callback',
    OIDC_POST_LOGOUT_REDIRECT_URI:
      data.OIDC_POST_LOGOUT_REDIRECT_URI ?? 'http://localhost:3000/',
  }));
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
