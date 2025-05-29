import { HttpStatus, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { CustomException } from 'src/common/exceptions/custom.exception';
import { ErrorCode } from 'src/common/modules/response/dto/error.schema';
import { DrizzleService } from 'src/drizzle/drizzle.service';
import { AdminLocalAuth } from 'src/drizzle/schema';
import { DrizzlePgTransaction } from 'src/drizzle/types';

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
      .from(AdminLocalAuth)
      .where(eq(AdminLocalAuth.email, payload.email))
      .execute();

    if (existingLocalAuth) {
      throw new CustomException(
        `User already exist with '${payload.email}'`,
        HttpStatus.CONFLICT,
        ErrorCode.DUPLICATE_ENTRY,
      );
    }

    const [adminLocalAuth] = await db
      .insert(AdminLocalAuth)
      .values(payload)
      .returning()
      .execute();

    return adminLocalAuth;
  }
}
