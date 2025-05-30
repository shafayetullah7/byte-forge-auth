import { Admin, AdminLocalAuth, Session } from 'src/drizzle/schema';

export type AccessAdminAuth = {
  admin: Admin;
  adminLocalAuth?: AdminLocalAuth;
  session?: Session;
  role: 'admin';
};
