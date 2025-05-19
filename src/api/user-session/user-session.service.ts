import { Injectable } from '@nestjs/common';
import { DrizzleService } from 'src/drizzle/drizzle.service';
import { AuthUser } from '../user-auth/types/auth-user.type';
import {
  DeviceInfo,
  UserSession,
} from 'src/drizzle/schema/user.session.schema';
import { UserLocalAuthSession } from 'src/drizzle/schema';

@Injectable()
export class UserSessionService {
  constructor(private readonly drizzle: DrizzleService) {}

  async createAuthSession(payload: {
    user: AuthUser;
    deviceInfo: DeviceInfo;
    ip: string;
  }) {
    const { user, deviceInfo, ip } = payload;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // now + 7 days

    const [session] = await this.drizzle.client
      .insert(UserSession)
      .values({ userId: user.id, deviceInfo, ip, expiresAt })
      .returning()
      .execute();

    if (user.localAuth) {
      await this.drizzle.client.insert(UserLocalAuthSession).values({
        sessionId: session.id,
        localAuthId: user.localAuth.userId,
      });
    }

    return session;
  }
}
