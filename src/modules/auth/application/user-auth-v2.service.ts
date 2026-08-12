import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { AppConfigService } from '@/common/modules/app-config/app-config.service';
import { UserSessionRepository } from '../repositories/user-session.repository';
import { SessionRepository } from '../repositories/session.repository';
import { eq, and, getTableColumns } from 'drizzle-orm';
import {
  sessionTable,
  userSessionTable,
  userTable,
} from '@/_db/drizzle/schema';
import { TSession, TUser } from '@/_db/drizzle/schema';
import * as crypto from 'crypto';

interface RefreshTokenResult {
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  user: TUser;
  session: TSession;
}

@Injectable()
export class UserAuthV2Service {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
    private readonly userSessionRepository: UserSessionRepository,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async generateAccessToken(user: TUser, session: TSession) {
    const payload = {
      sub: user.id,
      sessionId: session.id,
      role: 'user',
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.jwtUserAccessSecret,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expiresIn: this.configService.jwtUserAccessExp as any,
    });
  }

  async generateRefreshToken(user: TUser, session: TSession) {
    const payload = {
      sub: user.id,
      sessionId: session.id,
      role: 'user',
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.jwtUserRefreshSecret,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expiresIn: this.configService.jwtUserRefreshExp as any,
    });
  }

  async refreshTokens(
    currentRefreshToken: string,
  ): Promise<RefreshTokenResult> {
    // 1. Verify refresh token
    const payload = await this.jwtService.verifyAsync<{
      sub: string;
      sessionId: string;
      role: string;
    }>(currentRefreshToken, {
      secret: this.configService.jwtUserRefreshSecret,
    });

    // 2. Fetch session from DB with user details
    const userSession =
      await this.userSessionRepository.findUserSessionDetailsBySessionId(
        payload.sessionId,
      );

    if (!userSession) {
      throw new UnauthorizedException('Invalid session');
    }

    // 3. Check session revoked/expired
    if (userSession.session.revoked || userSession.session.logoutAt) {
      throw new UnauthorizedException('Session revoked or expired');
    }

    // 4. Check user deactivated
    if (userSession.user.isActive === false) {
      throw new UnauthorizedException('User account deactivated');
    }

    // 5. Check if session is expired
    const isExpired = new Date() > new Date(userSession.session.expiresAt);
    if (isExpired) {
      throw new UnauthorizedException('Session expired');
    }

    // 6. Generate new session ID (rotation)
    const newSessionId = crypto.randomUUID();
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const oldSessionId = userSession.session.id;

    // 7. Try to update session with new ID
    try {
      await this.drizzle.client.transaction(async (tx) => {
        await tx
          .update(sessionTable)
          .set({
            id: newSessionId,
            expiresAt: newExpiresAt,
            updatedAt: new Date(),
          })
          .where(eq(sessionTable.id, oldSessionId));
      });
    } catch (error) {
      // Update failed - check if another request already rotated this session
      const rotatedSession = await this.findRotatedSession(
        oldSessionId,
        userSession.user.id,
      );

      if (rotatedSession) {
        // Another request already rotated - use their result
        return await this.buildRefreshResult(userSession.user, rotatedSession);
      }

      // Not a rotation conflict - rethrow
      throw error;
    }

    // Success - build and return result
    return await this.buildRefreshResult(userSession.user, {
      ...userSession.session,
      id: newSessionId,
      expiresAt: newExpiresAt,
    });
  }

  /**
   * Find a session that was created by rotating the given old session.
   * This is used to handle race conditions where multiple requests try to
   * refresh the same session simultaneously.
   *
   * Strategy: Check if the old session ID still exists. If not, it means
   * another request already rotated it. In that case, find the user's
   * current active session that was updated most recently.
   */
  private async findRotatedSession(
    oldSessionId: string,
    userId: string,
  ): Promise<TSession | null> {
    // First check: does the old session still exist?
    const oldSessionStillExists = await this.drizzle.client
      .select({ id: sessionTable.id })
      .from(sessionTable)
      .where(eq(sessionTable.id, oldSessionId))
      .limit(1);

    if (oldSessionStillExists.length > 0) {
      // Old session still exists, so the update didn't fail due to rotation
      // This is a different error - return null to indicate no rotation found
      return null;
    }

    // Old session is gone - another request rotated it
    // Find the user's current active session, ordered by most recently updated
    const result = await this.drizzle.client
      .select({
        session: getTableColumns(sessionTable),
      })
      .from(userSessionTable)
      .innerJoin(sessionTable, eq(userSessionTable.sessionId, sessionTable.id))
      .innerJoin(userTable, eq(userSessionTable.userId, userTable.id))
      .where(and(eq(userTable.id, userId), eq(sessionTable.revoked, false)));

    // Find a valid session (not expired, not logged out), prefer most recently updated
    const now = new Date();
    const validSessions = result.filter(
      (r) => r.session.logoutAt === null && r.session.expiresAt > now,
    );

    if (validSessions.length === 0) {
      return null;
    }

    // Return the most recently updated session (likely the one from the rotation)
    validSessions.sort((a, b) => {
      const aTime = a.session.updatedAt?.getTime() || 0;
      const bTime = b.session.updatedAt?.getTime() || 0;
      return bTime - aTime;
    });

    return validSessions[0].session;
  }

  /**
   * Helper to build the refresh result object
   */
  private async buildRefreshResult(
    user: TUser,
    session: TSession,
  ): Promise<RefreshTokenResult> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user, session),
      this.generateRefreshToken(user, session),
    ]);

    return {
      tokens: {
        accessToken,
        refreshToken,
      },
      user,
      session,
    };
  }

  async getUserSessionById(sessionId: string) {
    return await this.userSessionRepository.findUserSessionDetailsBySessionId(
      sessionId,
    );
  }
}
