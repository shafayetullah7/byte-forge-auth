import { Injectable } from '@nestjs/common';
import { DrizzleService } from 'src/drizzle/drizzle.service';
import { CreateAdminSession } from './types';
import { SessionService } from 'src/api/session/session.service';
import {
  AdminLocalAuthSession,
  AdminSession,
  NewAdminSession,
} from 'src/drizzle/schema';

@Injectable()
export class AdminSessionService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly sessionService: SessionService,
  ) {}

  async createAdminAuthSession(payload: CreateAdminSession) {
    const {
      deviceInfo,
      ip,
      adminAuth: { admin, adminLocalAuth },
    } = payload;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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
      const adminSessionData: NewAdminSession = {
        adminId: admin.id,
        sessionId: newSession.id,
      };

      await tx.insert(AdminSession).values(adminSessionData).execute();

      if (adminLocalAuth) {
        await tx
          .insert(AdminLocalAuthSession)
          .values({
            sessionId: newSession.id,
            localAuthId: adminLocalAuth.adminId,
          })
          .execute();
      }

      return newSession;
    });

    return result;
  }
}
