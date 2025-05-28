import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { User } from './user.schema';
import { sql } from 'drizzle-orm/sql';
import { Session } from '../session';

export const UserSession = pgTable('user_sessions', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => User.id),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => Session.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type UserSession = typeof UserSession.$inferSelect;
export type NewUserSession = typeof UserSession.$inferInsert;
