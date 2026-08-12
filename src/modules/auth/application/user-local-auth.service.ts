import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { GetLocalUserQueryDto } from '../controllers/dto/get-local-user.dto';
import { and, eq, SQL } from 'drizzle-orm';
import { DrizzlePgTransaction } from '@/_db/drizzle/types';
import { HashingService } from '@/common/modules/hashing/hashing.service';
import { userLocalAuthTable, userTable } from '@/_db/drizzle/schema';

@Injectable()
export class UserLocalAuthService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly hashingService: HashingService,
  ) {}

  // async getLocalUser(query: GetLocalUserQueryDto) {
  //   const conditions: SQL[] = [];

  //   if (query.id) {
  //     conditions.push(eq(userLocalAuthTable.userId, query.id));
  //   }
  //   if (query.email) {
  //     conditions.push(eq(userLocalAuthTable.email, query.email));
  //   }

  //   if (conditions.length === 0) {
  //     return null;
  //   }

  //   const users = await this.drizzle.client
  //     .select({
  //       user: userTable,
  //       userLocalAuth: userLocalAuthTable,
  //     })
  //     .from(userTable)
  //     .innerJoin(
  //       userLocalAuthTable,
  //       eq(userLocalAuthTable.userId, userTable.id),
  //     )
  //     .where(and(...conditions))
  //     .execute();

  //   return users.length > 0 ? users[0] : null;
  // }

  async getLocalUser(query: GetLocalUserQueryDto) {
    const conditions: SQL[] = [];

    if (query.id) {
      conditions.push(eq(userTable.id, query.id)); // Use userTable.id since it's the same as userLocalAuthTable.userId
    }
    if (query.email) {
      conditions.push(eq(userLocalAuthTable.email, query.email));
    }

    if (conditions.length === 0) {
      return null;
    }

    const users = await this.drizzle.client
      .select({
        user: userTable,
        userLocalAuth: userLocalAuthTable,
      })
      .from(userTable)
      .innerJoin(
        userLocalAuthTable,
        eq(userLocalAuthTable.userId, userTable.id), // Join condition
      )
      .where(and(...conditions))
      .execute();

    return users.length > 0 ? users[0] : null;
  }

  async createUserLocalAuth(
    payload: { userId: string; email: string; password: string },
    tx?: DrizzlePgTransaction,
  ) {
    const db = tx || this.drizzle.client;

    // Check if email already exists
    const [existingLocalAuth] = await db
      .select()
      .from(userLocalAuthTable)
      .where(eq(userLocalAuthTable.email, payload.email))
      .execute();

    if (existingLocalAuth) {
      throw new ConflictException('An account already exists with this email');
    }

    // Hash password
    const hashedPassword = await this.hashingService.hash(payload.password);

    // Insert new local auth record
    const [localAuth] = await db
      .insert(userLocalAuthTable)
      .values({
        email: payload.email,
        password: hashedPassword,
        userId: payload.userId,
      })
      .returning()
      .execute();

    if (!localAuth) {
      throw new InternalServerErrorException(
        'Failed to create local authentication record',
      );
    }

    return localAuth;
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.drizzle.client
      .update(userLocalAuthTable)
      .set({ password: hashedPassword })
      .where(eq(userLocalAuthTable.userId, userId))
      .execute();
  }
}
