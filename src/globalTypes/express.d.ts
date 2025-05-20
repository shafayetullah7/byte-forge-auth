import { AuthUser } from 'src/common/types/auth-user.type';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}
