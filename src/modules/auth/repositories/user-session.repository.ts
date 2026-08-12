import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  sessionTable,
  TNewUserSession,
  TSession,
  TUser,
  TUserSession,
  userSessionTable,
  userTable,
} from '@/_db/drizzle/schema';
import { DrizzleTx } from '@/_db/drizzle/types';
import { eq, getTableColumns } from 'drizzle-orm';

@Injectable()
export class UserSessionRepository {
  constructor(private readonly drizzleService: DrizzleService) {}
  async createUserSession(
    payload: TNewUserSession,
    tx?: DrizzleTx,
  ): Promise<TUserSession> {
    const executor = tx || this.drizzleService.client;
    const [result] = await executor
      .insert(userSessionTable)
      .values([payload])
      .returning()
      .execute();
    return result;
  }

  async findUserSessionDetailsById(
    id: string,
    tx?: DrizzleTx,
  ): Promise<{ userSession: TUserSession; session: TSession | null } | null> {
    const executor = tx || this.drizzleService.client;
    const [result] = await executor
      .select({
        userSession: userSessionTable,
        session: sessionTable,
      })
      .from(userSessionTable)
      .leftJoin(sessionTable, eq(userSessionTable.sessionId, sessionTable.id))
      .where(eq(userSessionTable.id, id))
      .limit(1)
      .execute();

    const userSession = result?.userSession;
    const session = result?.session;
    return { userSession, session };
  }

  async findUserSessionDetailsBySessionId(
    sessionId: string,
    tx?: DrizzleTx,
  ): Promise<{
    userSession: TUserSession;
    session: TSession;
    user: TUser;
  } | null> {
    const executor = tx || this.drizzleService.client;
    const [result] = await executor
      .select({
        userSession: getTableColumns(userSessionTable),
        session: getTableColumns(sessionTable),
        user: getTableColumns(userTable),
      })
      .from(userSessionTable)
      .innerJoin(sessionTable, eq(userSessionTable.sessionId, sessionTable.id))
      .innerJoin(userTable, eq(userSessionTable.userId, userTable.id))
      .where(eq(userSessionTable.sessionId, sessionId))
      .limit(1)
      .execute();

    if (!result) {
      return null;
    }

    const userSession = result.userSession;
    const session = result?.session;
    const user = result.user;
    return { userSession, session, user };
  }
}
