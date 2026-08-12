import { HttpStatus, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { adminTable } from '@/_db/drizzle/schema';
import { DrizzlePgTransaction } from '@/_db/drizzle/types';

@Injectable()
export class AdminService {
  constructor(private readonly drizzle: DrizzleService) {}

  async createAdmin(
    payload: {
      userName: string;
      firstName: string;
      lastName: string;
    },
    tx?: DrizzlePgTransaction,
  ) {
    const { userName } = payload;

    const db = tx || this.drizzle.client;

    const [existingAdmin] = await db
      .select()
      .from(adminTable)
      .where(eq(adminTable.userName, userName));

    if (existingAdmin) {
      throw new CustomException({
        message: `'${userName}' is already in use.`,
        statusCode: HttpStatus.CONFLICT,
        errorCode: ErrorCode.DUPLICATE_ENTRY,
      });
    }

    const [newAdmin] = await db
      .insert(adminTable)
      .values(payload)
      .returning()
      .execute();

    return newAdmin;
  }
}
