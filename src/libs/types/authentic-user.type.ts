import { TSession, TUser } from '@/_db/drizzle/schema';

export type TAuthenticUser = {
  user: TUser;
  session: TSession;
};
