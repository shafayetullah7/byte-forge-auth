import { Injectable } from '@nestjs/common';
import { DrizzleService } from 'src/drizzle/drizzle.service';
import { NewSession, Session } from 'src/drizzle/schema';
import { DrizzlePgTransaction } from 'src/drizzle/types';

@Injectable()
export class SessionService {
  constructor(private readonly drizzle: DrizzleService) {}

  async createSession(payload: NewSession, tx?: DrizzlePgTransaction) {
    const db = tx || this.drizzle.client;
    const [newSession] = await db
      .insert(Session)
      .values(payload)
      .returning()
      .execute();

    return newSession;
  }
}
