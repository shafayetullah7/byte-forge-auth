import { sql } from 'drizzle-orm/sql';
import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';

export const User = pgTable('users', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  firstName: varchar('first_name', { length: 50 }).notNull(),
  lastName: varchar('last_name', { length: 50 }).notNull(),
  userName: varchar('user_name', { length: 50 }).unique().notNull(),
  avatar: text(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type User = typeof User.$inferSelect;
export type NewUser = typeof User.$inferInsert;
