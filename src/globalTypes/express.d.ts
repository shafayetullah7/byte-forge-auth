import { ActiveUserSession } from 'src/api/user/user-session/types/user-session.type';
import { AuthUser } from 'src/api/user/user-auth/types/local-auth-user.type';

declare module 'express-serve-static-core' {
  interface Request {
    user?: ActiveUserSession & AuthUser;
  }
}
