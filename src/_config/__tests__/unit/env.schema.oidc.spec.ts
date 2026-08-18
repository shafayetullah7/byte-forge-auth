import { envSchema, OIDC_PRODUCTION_REQUIRED_KEYS } from '@/_config/env.schema';

const baseEnv = {
  NODE_ENV: 'development' as const,
  PORT: '3005',
  APP_NAME: 'byte-forge-auth',
  FRONTEND_URL: 'http://localhost:3000',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_USER: 'user',
  DB_PASSWORD: 'password-password-password',
  DB_NAME: 'bf',
  COMPOSE_PROJECT_NAME: 'bf',
  APP_EXTERNAL_PORT: '3005',
  DB_EXTERNAL_PORT: '5432',
  SALT_ROUNDS: '10',
  MAIL_PROVIDER: 'console' as const,
  MAIL_HOST: 'localhost',
  MAIL_PORT: '25',
  MAIL_SECURE: 'false',
  MAIL_FROM_NAME: 'Byte Forge',
  MAIL_FROM_EMAIL: 'noreply@example.com',
  CLOUDINARY_CLOUD_NAME: 'cloud',
  CLOUDINARY_API_KEY: 'key',
  CLOUDINARY_API_SECRET: 'secret',
  SESSION_MAX_AGE: '86400',
  COOKIE_DOMAIN: 'localhost',
  JWT_ADMIN_ACCESS_SECRET: 'a'.repeat(32),
  JWT_ADMIN_ACCESS_EXP: '15m',
  JWT_ADMIN_REFRESH_SECRET: 'b'.repeat(32),
  JWT_ADMIN_REFRESH_EXP: '7d',
  ADMIN_REGISTRATION_OTP_EMAIL: 'admin@example.com',
};

describe('envSchema OIDC', () => {
  it('applies localhost OIDC defaults outside production', () => {
    const parsed = envSchema.parse(baseEnv);
    expect(parsed.OIDC_ISSUER).toBe('http://localhost:3010');
    expect(parsed.OIDC_CLIENT_ID).toBe('byte-forge-web');
    expect(parsed.OIDC_HTTP_TIMEOUT_MS).toBe(10_000);
  });

  it('requires OIDC vars in production', () => {
    const parsed = envSchema.safeParse({
      ...baseEnv,
      NODE_ENV: 'production',
    });

    expect(parsed.success).toBe(false);
    if (parsed.success) {
      return;
    }

    const paths = parsed.error.issues.map((issue) => issue.path[0]);
    for (const key of OIDC_PRODUCTION_REQUIRED_KEYS) {
      expect(paths).toContain(key);
    }
  });

  it('accepts explicit OIDC vars in production', () => {
    const parsed = envSchema.parse({
      ...baseEnv,
      NODE_ENV: 'production',
      OIDC_ISSUER: 'https://auth.example.com',
      OIDC_DEFAULT_RESOURCE: 'https://api.example.com',
      OIDC_CLIENT_ID: 'byte-forge-web',
      OIDC_REDIRECT_URI: 'https://api.example.com/api/v1/user/auth/oidc/callback',
      OIDC_POST_LOGOUT_REDIRECT_URI: 'https://shop.example.com/',
    });

    expect(parsed.OIDC_ISSUER).toBe('https://auth.example.com');
  });
});
