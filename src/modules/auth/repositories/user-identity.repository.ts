import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  TNewUserIdentity,
  TUserIdentity,
  userIdentityTable,
} from '@/_db/drizzle/schema';
import { DrizzleTx } from '@/_db/drizzle/types';

@Injectable()
export class UserIdentityRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async findByAuthSub(
    authSub: string,
    tx?: DrizzleTx,
  ): Promise<TUserIdentity | null> {
    const executor = tx ?? this.drizzleService.client;
    const [row] = await executor
      .select()
      .from(userIdentityTable)
      .where(eq(userIdentityTable.authSub, authSub))
      .limit(1)
      .execute();

    return row ?? null;
  }

  async findByLocalUserId(
    localUserId: string,
    tx?: DrizzleTx,
  ): Promise<TUserIdentity | null> {
    const executor = tx ?? this.drizzleService.client;
    const [row] = await executor
      .select()
      .from(userIdentityTable)
      .where(eq(userIdentityTable.localUserId, localUserId))
      .limit(1)
      .execute();

    return row ?? null;
  }

  async create(
    payload: TNewUserIdentity,
    tx?: DrizzleTx,
  ): Promise<TUserIdentity> {
    const executor = tx ?? this.drizzleService.client;
    const [row] = await executor
      .insert(userIdentityTable)
      .values(payload)
      .returning()
      .execute();

    return row;
  }
}
