import { User, UserLocalAuth } from 'src/drizzle/schema';

export type AuthUser = User & {
  localAuth?: UserLocalAuth;
};
