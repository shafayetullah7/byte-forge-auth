import { Session, User, UserLocalAuth } from 'src/drizzle/schema';

export type AccessUserAuth = {
  user: User;
  userLocalAuth?: UserLocalAuth;
  session?: Session;
  role: 'user';
};
