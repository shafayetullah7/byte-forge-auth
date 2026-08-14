import { Injectable } from '@nestjs/common';
import { and, eq, ne } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  adminRegistrationPendingTable,
  TAdminRegistrationPending,
} from '@/_db/drizzle/schema';
import { DrizzleTx } from '@/_db/drizzle/types';

export type UpsertAdminRegistrationPendingInput = {
  email: string;
  userName: string;
  firstName: string;
  lastName: string;
  hashedPassword: string;
  hashedOtp: string;
  expiresAt: Date;
};

@Injectable()
export class AdminRegistrationPendingRepository {
  constructor(private readonly db: DrizzleService) {}

  async findByEmail(
    email: string,
    tx?: DrizzleTx,
  ): Promise<TAdminRegistrationPending | null> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .select()
      .from(adminRegistrationPendingTable)
      .where(eq(adminRegistrationPendingTable.email, email))
      .limit(1);

    return row ?? null;
  }

  async findByUserNameExcludingEmail(
    userName: string,
    email: string,
    tx?: DrizzleTx,
  ): Promise<TAdminRegistrationPending | null> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .select()
      .from(adminRegistrationPendingTable)
      .where(
        and(
          eq(adminRegistrationPendingTable.userName, userName),
          ne(adminRegistrationPendingTable.email, email),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async upsertPendingRegistration(
    data: UpsertAdminRegistrationPendingInput,
    tx?: DrizzleTx,
  ): Promise<TAdminRegistrationPending> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .insert(adminRegistrationPendingTable)
      .values(data)
      .onConflictDoUpdate({
        target: adminRegistrationPendingTable.email,
        set: {
          userName: data.userName,
          firstName: data.firstName,
          lastName: data.lastName,
          hashedPassword: data.hashedPassword,
          hashedOtp: data.hashedOtp,
          expiresAt: data.expiresAt,
        },
      })
      .returning();

    return row;
  }

  async deleteByEmail(email: string, tx?: DrizzleTx): Promise<void> {
    const executor = this.db.getExecutor(tx);
    await executor
      .delete(adminRegistrationPendingTable)
      .where(eq(adminRegistrationPendingTable.email, email));
  }
}
