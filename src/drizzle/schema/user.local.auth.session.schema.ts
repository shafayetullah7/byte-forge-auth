import { sql } from 'drizzle-orm/sql';
import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { UserSession } from './user.session.schema';
import { UserLocalAuth } from './user.local.auth.schema';

export const UserLocalAuthSession = pgTable('user_local_auth_session', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => UserSession.id),
  localAuthId: uuid('local_auth_id')
    .notNull()
    .references(() => UserLocalAuth.userId),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type UserLocalAuthSession = typeof UserLocalAuthSession.$inferSelect;
export type NewUserLocalAuthSession = typeof UserLocalAuthSession.$inferInsert;
