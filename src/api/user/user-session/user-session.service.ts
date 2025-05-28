import { Injectable } from '@nestjs/common';
import { DrizzleService } from 'src/drizzle/drizzle.service';
import { AuthUser } from '../../../common/types/auth-user.type';
import {
  DeviceInfo,
  User,
  UserLocalAuthSession,
  UserSession,
} from 'src/drizzle/schema';
import { eq } from 'drizzle-orm';
import { ActiveUserSession } from './types/user-session.type';
import { SessionService } from 'src/api/session/session.service';

@Injectable()
export class UserSessionService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly sessionService: SessionService,
  ) {}

  async createAuthSession(payload: {
    user: AuthUser;
    deviceInfo: DeviceInfo;
    ip: string;
  }) {
    const { user, deviceInfo, ip } = payload;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // now + 7 days

    const sessionData = {
      deviceInfo,
      ip,
      expiresAt,
    };
    const newSession = await this.sessionService.createSession(sessionData);

    const userSessionData = { sessionId: newSession.id, userId: user.id };
    const [userSession] = await this.drizzle.client
      .insert(UserSession)
      .values(userSessionData)
      .returning()
      .execute();

    if (user.localAuth) {
      await this.drizzle.client.insert(UserLocalAuthSession).values({
        sessionId: userSession.id,
        localAuthId: user.localAuth.userId,
      });
    }

    return newSession;
  }

  async getUserSession(sessionId: string): Promise<ActiveUserSession | null> {
    const [session] = await this.drizzle.client
      .select({
        id: User.id,
        firstName: User.firstName,
        lastName: User.lastName,
        userName: User.userName,
        avatar: User.avatar,
        createdAt: User.createdAt,
        updatedAt: User.updatedAt,
        userSession: {
          id: UserSession.id,
          ip: UserSession.ip,
          revoked: UserSession.revoked,
          logoutAt: UserSession.logoutAt,
          expiresAt: UserSession.expiresAt,
          createdAt: UserSession.createdAt,
          updatedAt: UserSession.updatedAt,
        },
      })
      .from(User)
      .innerJoin(UserSession, eq(User.id, UserSession.userId))
      .where(eq(UserSession.id, sessionId))
      .execute();

    return session;
  }

  isSessionActive(payload: ActiveUserSession) {
    if (!payload) return false;
    if (!payload.userSession) return false;

    const now = new Date();
    return (
      !payload.userSession.revoked &&
      payload.userSession.logoutAt === null &&
      payload.userSession.expiresAt > now
    );
  }
}
