import { TablesRelationalConfig } from 'drizzle-orm';
import { NodePgTransaction } from 'drizzle-orm/node-postgres';
import * as schema from 'src/drizzle/schema';

export type DrizzlePgTransaction = NodePgTransaction<
  typeof schema,
  TablesRelationalConfig
>;
