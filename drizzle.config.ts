import * as dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config();

// const databaseUrl = process.env.DATABASE_URL;
// if (!databaseUrl) {
//   throw new Error('DATABASE_URL is missing in environment variables');
// }
// console.log({ databaseUrl });

export default defineConfig({
  schema: './src/drizzle/schema',
  out: './src/drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // url: databaseUrl,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'mydb',
    ssl: process.env.NODE_ENV === 'production',
  },
  verbose: true,
  strict: true,
  migrations: {
    table: 'drizzle_migrations',
    // tableName: 'drizzle_migrations',
  },
});
