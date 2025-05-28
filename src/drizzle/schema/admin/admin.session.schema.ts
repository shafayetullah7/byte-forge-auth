import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm/sql';
import { Admin } from './admin.schema';
import { Session } from '../session';

export const AdminSession = pgTable('admin_sessions', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  adminId: uuid('admin_id')
    .notNull()
    .references(() => Admin.id),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => Session.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type AdminSession = typeof AdminSession.$inferSelect;
export type NewAdminSession = typeof AdminSession.$inferInsert;
