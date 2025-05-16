import {
  boolean,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { User } from './user.schema';

export const UserLocalAuth = pgTable('user_local_auth', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => User.id),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  verfied: boolean('verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type UserLocalAuth = typeof UserLocalAuth.$inferSelect;
export type NewUserLocalAuth = typeof UserLocalAuth.$inferInsert;
