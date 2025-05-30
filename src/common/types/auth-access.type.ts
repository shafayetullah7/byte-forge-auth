import { AccessAdminAuth } from './admin-auth-access.type';
import { AccessUserAuth } from './user-auth-access.type';

export type AuthAccess = AccessAdminAuth | AccessUserAuth;
