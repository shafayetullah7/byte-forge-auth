import { sql } from 'drizzle-orm/sql';
import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { AdminLocalAuth } from './admin.local.auth.schema';
import { Session } from '../session';

export const AdminLocalAuthSession = pgTable('admin_local_auth_session', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => Session.id),
  localAuthId: uuid('local_auth_id')
    .notNull()
    .references(() => AdminLocalAuth.adminId),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type AdminLocalAuthSession = typeof AdminLocalAuthSession.$inferSelect;
export type NewAdminLocalAuthSession =
  typeof AdminLocalAuthSession.$inferInsert;
