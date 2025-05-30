import { User, UserLocalAuth } from 'src/drizzle/schema';

export type LocalAuthenticUser = {
  user: User;
  userLocalAuth: UserLocalAuth;
};
