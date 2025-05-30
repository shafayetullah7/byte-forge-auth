import { User, UserLocalAuth } from 'src/drizzle/schema';

export type UserAuth = {
  user: User;
  userLocalAuth: UserLocalAuth;
};
