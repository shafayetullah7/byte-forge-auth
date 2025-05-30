import { Admin, Session } from 'src/drizzle/schema';

export type AuthenticAdmin = {
  admin: Admin;
  session: Session;
};
