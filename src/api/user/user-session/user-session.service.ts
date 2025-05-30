import { Injectable } from '@nestjs/common';
import { DrizzleService } from 'src/drizzle/drizzle.service';
import { UserAuth } from '../user-auth/types/user-auth.type';
import {
  DeviceInfo,
  Session,
  User,
  UserLocalAuthSession,
  UserSession,
} from 'src/drizzle/schema';
import { eq } from 'drizzle-orm';
import { SessionService } from 'src/api/session/session.service';

@Injectable()
export class UserSessionService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly sessionService: SessionService,
  ) {}

  async createAuthSession(payload: {
    userAuth: UserAuth;
    deviceInfo: DeviceInfo;
    ip: string;
  }) {
    const {
      userAuth: { user, userLocalAuth },
      deviceInfo,
      ip,
    } = payload;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // now + 7 days

    const sessionData = {
      deviceInfo,
      ip,
      expiresAt,
    };

    const result = await this.drizzle.client.transaction(async (tx) => {
      const newSession = await this.sessionService.createSession(
        sessionData,
        tx,
      );
      const userSessionData = { sessionId: newSession.id, userId: user.id };
      await tx.insert(UserSession).values(userSessionData).execute();

      if (userLocalAuth) {
        await tx.insert(UserLocalAuthSession).values({
          sessionId: newSession.id,
          localAuthId: userLocalAuth.userId,
        });
      }
      return newSession;
    });

    return result;
  }

  async getUserSession(
    sessionId: string,
  ): Promise<{ user: User; session: Session } | null> {
    const [userSession] = await this.drizzle.client
      .select({
        user: User,
        session: Session,
      })
      .from(User)
      .innerJoin(UserSession, eq(User.id, UserSession.userId))
      .innerJoin(Session, eq(Session.id, UserSession.sessionId))
      .where(eq(UserSession.id, sessionId))
      .execute();

    return userSession;
  }

  isSessionActive(payload: { user: User; session: Session }) {
    if (!payload) return false;
    if (!payload.session) return false;

    const now = new Date();
    return (
      !payload.session.revoked &&
      payload.session.logoutAt === null &&
      payload.session.expiresAt > now
    );
  }
}
