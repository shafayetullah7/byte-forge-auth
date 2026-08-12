import { HttpStatus, Injectable } from '@nestjs/common';
import { and, eq, SQL } from 'drizzle-orm';
import { CustomException } from '@/common/exceptions/custom.exception';
import { ErrorCode } from '@/common/modules/response/dto/error.schema';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { adminLocalAuthTable, adminTable } from '@/_db/drizzle/schema';
import { DrizzlePgTransaction } from '@/_db/drizzle/types';

@Injectable()
export class AdminLocalAuthService {
  constructor(private readonly drizzle: DrizzleService) {}

  async createAdminLocalAuth(
    payload: { adminId: string; email: string; password: string },
    tx?: DrizzlePgTransaction,
  ) {
    const db = tx || this.drizzle.client;

    const [existingLocalAuth] = await db
      .select()
      .from(adminLocalAuthTable)
      .where(eq(adminLocalAuthTable.email, payload.email))
      .execute();

    if (existingLocalAuth) {
      throw new CustomException({
        message: `User already exist with '${payload.email}'`,
        statusCode: HttpStatus.CONFLICT,
        errorCode: ErrorCode.DUPLICATE_ENTRY,
      });
    }

    const [adminLocalAuth] = await db
      .insert(adminLocalAuthTable)
      .values(payload)
      .returning()
      .execute();

    return adminLocalAuth;
  }

  async getLocalAdmin(query: { id?: string; email?: string }) {
    const conditions: SQL[] = [];

    if (query.id) {
      conditions.push(eq(adminLocalAuthTable.adminId, query.id));
    }
    if (query.email) {
      conditions.push(eq(adminLocalAuthTable.email, query.email));
    }

    const admins = await this.drizzle.client
      .select({
        admin: adminTable,
        adminLocalAuth: adminLocalAuthTable,
      })
      .from(adminTable)
      .innerJoin(
        adminLocalAuthTable,
        eq(adminTable.id, adminLocalAuthTable.adminId),
      )
      .where(and(...conditions))
      .execute();

    return admins;
  }
}
