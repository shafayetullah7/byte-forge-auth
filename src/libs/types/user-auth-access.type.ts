import { TSession, TUser, TShop } from '@/_db/drizzle/schema';

export type TAuthorizedShop = TShop;

export type AccessUserAuth = {
  user: TUser;
  session: TSession;
  shop?: TAuthorizedShop;
};
