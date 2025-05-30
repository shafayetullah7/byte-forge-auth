import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppEnv } from 'src/config/env.schema';

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
  get databaseUrl(): AppEnv['DATABASE_URL'] {
    return this.configService.getOrThrow('DATABASE_URL');
  }

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

  // === Email ===
  get gmailUser(): AppEnv['GMAIL_USER'] {
    return this.configService.getOrThrow('GMAIL_USER');
  }
  get gmailAppPassword(): AppEnv['GMAIL_APP_PASSWORD'] {
    return this.configService.getOrThrow('GMAIL_APP_PASSWORD');
  }
  get defaultFromEmail(): AppEnv['DEFAULT_FROM_EMAIL'] {
    return this.configService.getOrThrow('DEFAULT_FROM_EMAIL');
  }
}
