import { AuthUser } from 'src/api/user-auth/types/auth-user.type';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}
