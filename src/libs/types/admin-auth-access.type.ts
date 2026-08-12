import { TAdmin, TSession } from '@/_db/drizzle/schema';

export type AccessAdminAuth = {
  admin: TAdmin;
  session?: TSession;
};
