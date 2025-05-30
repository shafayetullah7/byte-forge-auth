import { Session, User } from 'src/drizzle/schema';

export type AuthenticUser = {
  user: User;
  session: Session;
};
