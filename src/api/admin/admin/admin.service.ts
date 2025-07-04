import { HttpStatus, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { CustomException } from 'src/common/exceptions/custom.exception';
import { ErrorCode } from 'src/common/modules/response/dto/error.schema';
import { DrizzleService } from 'src/drizzle/drizzle.service';
import { Admin } from 'src/drizzle/schema';
import { DrizzlePgTransaction } from 'src/drizzle/types';

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
      .from(Admin)
      .where(eq(Admin.userName, userName));

    if (existingAdmin) {
      throw new CustomException(
        `'${userName}' is already in use.`,
        HttpStatus.CONFLICT,
        ErrorCode.DUPLICATE_ENTRY,
      );
    }

    const [newAdmin] = await db
      .insert(Admin)
      .values(payload)
      .returning()
      .execute();

    return newAdmin;
  }
}
