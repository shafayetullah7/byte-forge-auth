import { envSchema } from './env.schema';
import { config as loadEnv } from 'dotenv';
import * as path from 'path';

loadEnv({
  path: path.resolve(
    process.cwd(),
    `.env.${process.env.NODE_ENV || 'development'}`,
  ),
});

export default () => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment:', parsed.error.format());
    process.exit(1);
  }

  const env = parsed.data;
  console.log({ env });

  return {
    port: env.PORT,
    database: {
      host: env.DB_HOST,
      port: env.DB_PORT,
    },
  };
};
