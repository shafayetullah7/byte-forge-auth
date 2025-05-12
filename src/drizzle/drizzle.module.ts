import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
// import { DrizzleClient } from './types';

export const DRIZZLE = Symbol('drizzle-connection');
@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      // eslint-disable-next-line @typescript-eslint/require-await
      useFactory: async (configService: ConfigService) => {
        // const dbUrl = configService.get<string>('DATABASE_URL');
        // const pool = new Pool({
        //   connectionString: dbUrl,
        //   ssl: true,
        // });
        // return drizzle(pool, { schema }) as NodePgDatabase<typeof schema>;
        // const connectionString = configService.get<string>('DATABASE_URL');

        // DB_HOST = db;
        // DB_PORT = 5432;
        // DB_USER = admin;
        // DB_PASSWORD = 1234;
        // DB_NAME = mydb;

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
          logger: configService.get('NODE_ENV') !== 'production', // Enable SQL logging in dev
        }) as NodePgDatabase<typeof schema>;
      },
    },
    // {
    //   provide: 'DRIZZLE_CLEANUP',
    //   useFactory: (drizzleClient: DrizzleClient) => ({
    //     onApplicationShutdown: async () => {
    //       const pool = drizzleClient.session.client as Pool;
    //       await pool.end();
    //     },
    //   }),
    //   inject: ['DRIZZLE_CLIENT'],
    // },
  ],
  exports: [DRIZZLE],
})
export class DrizzleModule {}
