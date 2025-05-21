import { ActiveUserSession } from 'src/api/user-session/types/user-session.type';
import { AuthUser } from 'src/common/types/auth-user.type';

declare module 'express-serve-static-core' {
  interface Request {
    user?: ActiveUserSession & AuthUser;
  }
}
