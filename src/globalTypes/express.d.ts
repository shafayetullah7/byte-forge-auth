import { AuthAccess } from '@/libs/types';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthAccess;
  }
}
