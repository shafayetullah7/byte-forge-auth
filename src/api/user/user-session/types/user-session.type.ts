import { User } from 'src/drizzle/schema';

export type ActiveUserSession = User & {
  userSession?: {
    id: string;
    ip: string | null;
    revoked: boolean;
    logoutAt: Date | null;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
  };
};
