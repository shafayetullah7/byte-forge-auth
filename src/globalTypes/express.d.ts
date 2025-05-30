import { AuthAccess } from 'src/common/types';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthAccess;
  }
}
