import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppEnv } from '@/_config/env.schema';
import { getAllowedOrigins } from '@/libs/security/allowed-origins';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  // === Application ===
  get nodeEnv(): AppEnv['NODE_ENV'] {
    return this.configService.getOrThrow('NODE_ENV');
  }
  get port(): AppEnv['PORT'] {
    return this.configService.getOrThrow('PORT');
  }
  get appName(): AppEnv['APP_NAME'] {
    return this.configService.getOrThrow('APP_NAME');
  }

  // === Database ===
  get dbHost(): AppEnv['DB_HOST'] {
    return this.configService.getOrThrow('DB_HOST');
  }
  get dbPort(): AppEnv['DB_PORT'] {
    return this.configService.getOrThrow('DB_PORT');
  }
  get dbUser(): AppEnv['DB_USER'] {
    return this.configService.getOrThrow('DB_USER');
  }

  get dbPassword(): AppEnv['DB_PASSWORD'] {
    return this.configService.getOrThrow('DB_PASSWORD');
  }
  get dbName(): AppEnv['DB_NAME'] {
    return this.configService.getOrThrow('DB_NAME');
  }
  // get databaseUrl(): AppEnv['DATABASE_URL'] {
  //   return this.configService.getOrThrow('DATABASE_URL');
  // }

  // === Docker Compose ===
  get composeProjectName(): AppEnv['COMPOSE_PROJECT_NAME'] {
    return this.configService.getOrThrow('COMPOSE_PROJECT_NAME');
  }
  get appExternalPort(): AppEnv['APP_EXTERNAL_PORT'] {
    return this.configService.getOrThrow('APP_EXTERNAL_PORT');
  }
  get dbExternalPort(): AppEnv['DB_EXTERNAL_PORT'] {
    return this.configService.getOrThrow('DB_EXTERNAL_PORT');
  }

  // === Security ===
  get saltRounds(): AppEnv['SALT_ROUNDS'] {
    return this.configService.getOrThrow('SALT_ROUNDS');
  }

  // === Cloudinary ===
  get cloudinaryCloudName(): AppEnv['CLOUDINARY_CLOUD_NAME'] {
    return this.configService.getOrThrow('CLOUDINARY_CLOUD_NAME');
  }
  get cloudinaryApiKey(): AppEnv['CLOUDINARY_API_KEY'] {
    return this.configService.getOrThrow('CLOUDINARY_API_KEY');
  }
  get cloudinaryApiSecret(): AppEnv['CLOUDINARY_API_SECRET'] {
    return this.configService.getOrThrow('CLOUDINARY_API_SECRET');
  }

  // === JWT Secrets ===
  get jwtSecretResetRequest(): AppEnv['JWT_SECRET_RESET_REQUEST'] {
    return this.configService.getOrThrow('JWT_SECRET_RESET_REQUEST');
  }
  get jwtSecretResetAccess(): AppEnv['JWT_SECRET_RESET_ACCESS'] {
    return this.configService.getOrThrow('JWT_SECRET_RESET_ACCESS');
  }

  // === Session & Cookie ===
  get sessionMaxAge(): AppEnv['SESSION_MAX_AGE'] {
    return this.configService.getOrThrow('SESSION_MAX_AGE');
  }
  get cookieDomain(): AppEnv['COOKIE_DOMAIN'] {
    return this.configService.getOrThrow('COOKIE_DOMAIN');
  }
  get allowedOrigins(): string[] {
    return getAllowedOrigins();
  }

  // === Mail ===
  get mailProvider(): AppEnv['MAIL_PROVIDER'] {
    return this.configService.getOrThrow('MAIL_PROVIDER');
  }
  get mailHost(): AppEnv['MAIL_HOST'] {
    return this.configService.getOrThrow('MAIL_HOST');
  }
  get mailPort(): AppEnv['MAIL_PORT'] {
    return this.configService.getOrThrow('MAIL_PORT');
  }
  get mailSecure(): AppEnv['MAIL_SECURE'] {
    return this.configService.getOrThrow('MAIL_SECURE');
  }
  get mailUser(): AppEnv['MAIL_USER'] {
    return this.configService.get('MAIL_USER');
  }
  get mailPassword(): AppEnv['MAIL_PASSWORD'] {
    return this.configService.get('MAIL_PASSWORD');
  }
  get mailFromName(): AppEnv['MAIL_FROM_NAME'] {
    return this.configService.getOrThrow('MAIL_FROM_NAME');
  }
  get mailFromEmail(): AppEnv['MAIL_FROM_EMAIL'] {
    return this.configService.getOrThrow('MAIL_FROM_EMAIL');
  }

  // === Admin JWT ===
  get jwtAdminAccessSecret(): AppEnv['JWT_ADMIN_ACCESS_SECRET'] {
    return this.configService.getOrThrow('JWT_ADMIN_ACCESS_SECRET');
  }
  get jwtAdminAccessExp(): AppEnv['JWT_ADMIN_ACCESS_EXP'] {
    return this.configService.getOrThrow('JWT_ADMIN_ACCESS_EXP');
  }
  get jwtAdminRefreshSecret(): AppEnv['JWT_ADMIN_REFRESH_SECRET'] {
    return this.configService.getOrThrow('JWT_ADMIN_REFRESH_SECRET');
  }
  get jwtAdminRefreshExp(): AppEnv['JWT_ADMIN_REFRESH_EXP'] {
    return this.configService.getOrThrow('JWT_ADMIN_REFRESH_EXP');
  }

  // === User JWT ===
  get jwtUserAccessSecret(): AppEnv['JWT_USER_ACCESS_SECRET'] {
    return this.configService.getOrThrow('JWT_USER_ACCESS_SECRET');
  }
  get jwtUserAccessExp(): AppEnv['JWT_USER_ACCESS_EXP'] {
    return this.configService.getOrThrow('JWT_USER_ACCESS_EXP');
  }
  get jwtUserRefreshSecret(): AppEnv['JWT_USER_REFRESH_SECRET'] {
    return this.configService.getOrThrow('JWT_USER_REFRESH_SECRET');
  }
  get jwtUserRefreshExp(): AppEnv['JWT_USER_REFRESH_EXP'] {
    return this.configService.getOrThrow('JWT_USER_REFRESH_EXP');
  }

  // === Plant AI (Gemini) ===
  get plantAiEnabled(): boolean {
    return this.configService.get('PLANT_AI_ENABLED') === 'true';
  }

  get geminiApiKey(): string | undefined {
    return this.configService.get('GEMINI_API_KEY');
  }

  get geminiModel(): string {
    return this.configService.get('GEMINI_MODEL') ?? 'gemini-3.6-flash';
  }

  /** True when flag is on and API key is configured. */
  get isPlantAiEnabled(): boolean {
    return this.plantAiEnabled && Boolean(this.geminiApiKey?.trim());
  }

  get plantAiRateLimitPerDay(): number {
    return this.configService.get('PLANT_AI_RATE_LIMIT_PER_DAY') ?? 20;
  }

  get plantAiMaxImageBytes(): number {
    return this.configService.get('PLANT_AI_MAX_IMAGE_BYTES') ?? 5 * 1024 * 1024;
  }

  get plantAiMaxOutputTokens(): number {
    return this.configService.get('PLANT_AI_MAX_OUTPUT_TOKENS') ?? 8192;
  }

  get plantAiGeminiTimeoutMs(): number {
    return this.configService.get('PLANT_AI_GEMINI_TIMEOUT_MS') ?? 120_000;
  }
}
