import { TUser, TUserLocalAuth } from '@/_db/drizzle/schema';

export type UserAuth = {
  user: TUser;
  userLocalAuth: TUserLocalAuth;
};
