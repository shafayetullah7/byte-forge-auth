import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
// import { DrizzleClient } from './types';
import { DrizzleService } from './drizzle.service';
import { DRIZZLE } from './types/drizzle.token';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      // eslint-disable-next-line @typescript-eslint/require-await
      useFactory: async (configService: ConfigService) => {
        const dbHost = configService.get<string>('DB_HOST');
        const dbPort = configService.get<number>('DB_PORT');
        const dbUser = configService.get<string>('DB_USER');
        const dbPass = configService.get<string>('DB_PASSWORD');
        const dbName = configService.get<string>('DB_NAME');

        const pool = new Pool({
          //   connectionString,
          host: dbHost,
          port: dbPort,
          user: dbUser,
          password: dbPass,
          database: dbName,
          ssl:
            configService.get('NODE_ENV') === 'production'
              ? { rejectUnauthorized: false }
              : false,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        });

        pool.on('error', (err) => {
          console.error('PostgreSQL pool error:', err);
        });

        return drizzle(pool, {
          schema,
          // logger: configService.get('NODE_ENV') !== 'production', // Enable SQL logging in dev
        }) as NodePgDatabase<typeof schema>;
      },
    },
    DrizzleService,
  ],
  exports: [DRIZZLE, DrizzleService],
})
export class DrizzleModule {}
