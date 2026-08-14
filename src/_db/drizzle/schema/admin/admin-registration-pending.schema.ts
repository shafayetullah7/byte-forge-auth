import {
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/** In-flight admin registrations awaiting gatekeeper OTP verification. */
export const adminRegistrationPendingTable = pgTable(
  'admin_registration_pending',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    userName: varchar('user_name', { length: 50 }).notNull().unique(),
    firstName: varchar('first_name', { length: 50 }).notNull(),
    lastName: varchar('last_name', { length: 50 }).notNull(),
    hashedPassword: varchar('hashed_password', { length: 255 }).notNull(),
    hashedOtp: varchar('hashed_otp', { length: 255 }).notNull(),
    expiresAt: timestamp('expires_at', {
      mode: 'date',
      withTimezone: true,
    }).notNull(),
    createdAt: timestamp('created_at', {
      mode: 'date',
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
);

export type TAdminRegistrationPending =
  typeof adminRegistrationPendingTable.$inferSelect;
export type TNewAdminRegistrationPending =
  typeof adminRegistrationPendingTable.$inferInsert;
