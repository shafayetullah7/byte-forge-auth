import { TSession, TUser } from '@/_db/drizzle/schema';

export type TAuthenticUser = {
  user: TUser;
  /** Legacy user sessions removed (OIDC-only); always null for buyers. */
  session: TSession | null;
};
