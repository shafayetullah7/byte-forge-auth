import {
  boolean,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { Admin } from './admin.schema';

export const AdminLocalAuth = pgTable('admin_local_auth', {
  adminId: uuid('admin_id')
    .primaryKey()
    .references(() => Admin.id),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  verfied: boolean('verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type AdminLocalAuth = typeof AdminLocalAuth.$inferSelect;
export type NewAdminLocalAuth = typeof AdminLocalAuth.$inferInsert;
