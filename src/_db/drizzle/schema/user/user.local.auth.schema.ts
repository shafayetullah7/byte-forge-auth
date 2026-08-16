import {
  boolean,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { userTable } from './user.schema';

/** @deprecated Legacy password storage — OIDC users use `user_identities` only (BF-MIG-6). */
export const userLocalAuthTable = pgTable('user_local_auth', {
  id: uuid('id').defaultRandom().primaryKey(), // new primary key for this table

  userId: uuid('user_id')
    .notNull()
    .unique() // ensure one-to-one relation
    .references(() => userTable.id, { onDelete: 'cascade' }),

  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  verified: boolean('verified').default(false).notNull(), // fixed typo (was 'verfied')

  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type TUserLocalAuth = typeof userLocalAuthTable.$inferSelect;
export type TNewUserLocalAuth = typeof userLocalAuthTable.$inferInsert;
