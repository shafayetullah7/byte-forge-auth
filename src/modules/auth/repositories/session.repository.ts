import { SQL, eq, gt, gte, lt, lte, isNull, not, and } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { sessionTable, TSession, TNewSession } from '@/_db/drizzle/schema';
import { Injectable } from '@nestjs/common';
import { DrizzleTx } from '@/_db/drizzle/types';

export interface SessionQuery {
  id?: string;
  revoked?: boolean;
  ip?: string;
  logoutAt?: {
    isNull?: boolean;
    gt?: Date;
    gte?: Date;
    lt?: Date;
    lte?: Date;
  };
  expiresAt?: {
    gt?: Date;
    gte?: Date;
    lt?: Date;
    lte?: Date;
  };
}

@Injectable()
export class SessionRepository {
  constructor(private readonly db: DrizzleService) {}

  private buildWhere(options?: SessionQuery): SQL[] {
    if (!options) return [];

    const where: SQL[] = [];

    if (options.id) where.push(eq(sessionTable.id, options.id));
    if (options.revoked !== undefined)
      where.push(eq(sessionTable.revoked, options.revoked));
    if (options.ip) where.push(eq(sessionTable.ip, options.ip));

    // logoutAt filters
    if (options.logoutAt) {
      const l = options.logoutAt;
      if (l.isNull !== undefined) {
        where.push(
          l.isNull
            ? isNull(sessionTable.logoutAt)
            : not(isNull(sessionTable.logoutAt)),
        );
      }
      if (l.gt) where.push(gt(sessionTable.logoutAt, l.gt));
      if (l.gte) where.push(gte(sessionTable.logoutAt, l.gte));
      if (l.lt) where.push(lt(sessionTable.logoutAt, l.lt));
      if (l.lte) where.push(lte(sessionTable.logoutAt, l.lte));
    }

    // expiresAt filters
    if (options.expiresAt) {
      const e = options.expiresAt;
      if (e.gt) where.push(gt(sessionTable.expiresAt, e.gt));
      if (e.gte) where.push(gte(sessionTable.expiresAt, e.gte));
      if (e.lt) where.push(lt(sessionTable.expiresAt, e.lt));
      if (e.lte) where.push(lte(sessionTable.expiresAt, e.lte));
    }

    return where;
  }

  async findOne(
    options?: SessionQuery,
    tx?: DrizzleTx,
  ): Promise<TSession | null> {
    const executor = this.db.getExecutor(tx);
    const where = this.buildWhere(options);
    const [row] = await executor
      .select()
      .from(sessionTable)
      .where(and(...where))
      .limit(1)
      .execute();
    return row ?? null;
  }

  async create(data: TNewSession, tx?: DrizzleTx): Promise<TSession> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor.insert(sessionTable).values(data).returning();
    return row;
  }

  async update(
    data: Partial<TNewSession>,
    options: SessionQuery,
    tx?: DrizzleTx,
  ): Promise<TSession[]> {
    const executor = this.db.getExecutor(tx);
    const where = this.buildWhere(options);
    return await executor
      .update(sessionTable)
      .set(data)
      .where(and(...where))
      .returning()
      .execute();
  }

  async delete(where: SQL, tx?: DrizzleTx): Promise<boolean> {
    const executor = this.db.getExecutor(tx);
    const deleted = await executor
      .delete(sessionTable)
      .where(where)
      .returning()
      .execute();
    return deleted.length > 0;
  }

  isSessionActive(session: TSession): boolean {
    const now = new Date();
    return (
      !session.revoked && session.logoutAt === null && session.expiresAt > now
    );
  }
}
