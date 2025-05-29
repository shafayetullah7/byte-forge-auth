import { User } from 'src/drizzle/schema';

export type ActiveUserSession = User & {
  session?: {
    id: string;
    ip: string | null;
    revoked: boolean;
    logoutAt: Date | null;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
  };
};
