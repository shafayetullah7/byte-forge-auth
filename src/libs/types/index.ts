export * from './admin-auth-access.type';
export * from './user-auth-access.type';
export * from './authentic-user.type';
export * from './authentic-admin.type';
export * from './pagination.type';
export * from './cart-context.type';
export * from './cart-context.type';

import { AccessAdminAuth } from './admin-auth-access.type';
import { AccessUserAuth } from './user-auth-access.type';

export type AuthAccess = AccessAdminAuth | AccessUserAuth;
