import { pgTable, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { userTable } from './user.schema';

export const userIdentityTable = pgTable(
  'user_identities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    authSub: uuid('auth_sub').notNull(),
    localUserId: uuid('local_user_id')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('user_identities_auth_sub_unique').on(table.authSub),
    uniqueIndex('user_identities_local_user_id_unique').on(table.localUserId),
  ],
);

export type TUserIdentity = typeof userIdentityTable.$inferSelect;
export type TNewUserIdentity = typeof userIdentityTable.$inferInsert;

export const userIdentityRelations = relations(userIdentityTable, ({ one }) => ({
  user: one(userTable, {
    fields: [userIdentityTable.localUserId],
    references: [userTable.id],
  }),
}));
