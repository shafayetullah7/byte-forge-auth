import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { CreateAdminSession } from './types';
import { SessionRepository } from '@/modules/auth/repositories/session.repository';
import {
  adminSessionTable,
  adminTable,
  sessionTable,
  TAdmin,
  TSession,
  TNewAdminSession,
} from '@/_db/drizzle/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class AdminSessionService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async createAdminAuthSession(payload: CreateAdminSession) {
    const {
      deviceInfo,
      ip,
      adminAuth: { admin },
    } = payload;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const sessionData = {
      deviceInfo,
      ip,
      expiresAt,
    };

    const result = await this.drizzle.client.transaction(async (tx) => {
      const newSession = await this.sessionRepository.create(sessionData, tx);
      const adminSessionData: TNewAdminSession = {
        adminId: admin.id,
        sessionId: newSession.id,
      };

      await tx.insert(adminSessionTable).values(adminSessionData).execute();

      return newSession;
    });

    return result;
  }

  async getAdminSession(
    sessionId: string,
  ): Promise<{ admin: TAdmin; session: TSession } | null> {
    const [adminSession] = await this.drizzle.client
      .select({
        admin: adminTable,
        session: sessionTable,
      })
      .from(adminTable)
      .innerJoin(
        adminSessionTable,
        eq(adminTable.id, adminSessionTable.adminId),
      )
      .innerJoin(sessionTable, eq(sessionTable.id, adminSessionTable.sessionId))
      .where(eq(sessionTable.id, sessionId))
      .execute();

    return adminSession || null;
  }

  async revokeSession(sessionId: string) {
    return await this.sessionRepository.update(
      { revoked: true, logoutAt: new Date() },
      { id: sessionId },
    );
  }
}
