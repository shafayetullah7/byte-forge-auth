import { Injectable } from '@nestjs/common';
import { DrizzleService } from 'src/drizzle/drizzle.service';
import { GetLocalUserQueryDto } from './dto/get-local-user.dto';
import { User, UserLocalAuth } from 'src/drizzle/schema';
import { and, eq, SQL } from 'drizzle-orm';

@Injectable()
export class UserLocalAuthService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getLocalUser(query: GetLocalUserQueryDto) {
    const conditions: SQL[] = [];
    if (query.id) {
      conditions.push(eq(UserLocalAuth.userId, query.id));
    }
    if (query.email) {
      conditions.push(eq(UserLocalAuth.email, query.email));
    }
    const users = await this.drizzle.client
      .select({
        id: User.id,
        firstName: User.firstName,
        lastName: User.lastName,
        userName: User.userName,
        avatar: User.avatar,
        createdAt: User.createdAt,
        updatedAt: User.updatedAt,
        localAuth: UserLocalAuth,
      })
      .from(User)
      .innerJoin(UserLocalAuth, eq(User.id, UserLocalAuth.userId))
      .where(and(...conditions))
      .execute();

    return users;
  }
}
