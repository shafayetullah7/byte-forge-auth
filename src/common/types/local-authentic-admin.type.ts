import { Admin, AdminLocalAuth } from 'src/drizzle/schema';

export type LocalAuthenticAdmin = {
  admin: Admin;
  adminLocalAuth: AdminLocalAuth;
};
