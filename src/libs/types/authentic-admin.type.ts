import { TAdmin, TSession } from '@/_db/drizzle/schema';

export type AuthenticAdmin = {
  admin: TAdmin;
  session: TSession;
};
