import {
  boolean,
  customType,
  inet,
  pgTable,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { sql } from 'drizzle-orm/sql';
import { DeviceType } from 'src/drizzle/enum';

const deviceTypeSchema = z.nativeEnum(DeviceType);

export const deviceInfoSchema = z.object({
  os: z.object({
    name: z.string(),
    version: z.string(),
  }),
  browser: z.object({
    name: z.string(),
    version: z.string(),
  }),
  device: z.object({
    type: deviceTypeSchema,
    brand: z.string().optional(),
    model: z.string().optional(),
  }),
  isBot: z.boolean(),
});

export type DeviceInfo = z.infer<typeof deviceInfoSchema>;

const deviceInfoJson = customType<{ data: DeviceInfo; driverData: unknown }>({
  dataType() {
    return 'jsonb';
  },
  toDriver(value: DeviceInfo): unknown {
    return deviceInfoSchema.parse(value);
  },
  fromDriver(value: unknown): DeviceInfo {
    return deviceInfoSchema.parse(value);
  },
});

export const Session = pgTable('sessions', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  deviceInfo: deviceInfoJson('device_info').notNull(),
  ip: inet('ip'),
  revoked: boolean('revoked').notNull().default(false),
  logoutAt: timestamp('logout_at', {
    withTimezone: true,
    mode: 'date',
  }),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
    mode: 'date',
  }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type Session = typeof Session.$inferSelect;
export type NewSession = typeof Session.$inferInsert;
