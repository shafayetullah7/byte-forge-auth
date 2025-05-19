import { ConflictException, Injectable } from '@nestjs/common';
import { DrizzleService } from 'src/drizzle/drizzle.service';
import { GetLocalUserQueryDto } from './dto/get-local-user.dto';
import { User, UserLocalAuth } from 'src/drizzle/schema';
import { and, eq, SQL } from 'drizzle-orm';
import { CreateLocalUserDto } from './dto/create-local-user.dto';

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

  async createUser(
    payload: {
      userName: string;
      firstName: string;
      lastName: string;
    },
    tx: any,
  ) {
    const [user] = await this.drizzle.client
      .select()
      .from(User)
      .where(eq(User.userName, payload.userName))
      .execute();

    if (user) {
      throw new ConflictException('username already exists');
    }

    const [newUser] = await this.drizzle.client
      .insert(User)
      .values({
        firstName: payload.firstName,
        lastName: payload.lastName,
        userName: payload.userName,
      })
      .returning()
      .execute();
  }

  async createLocalUser(payload: CreateLocalUserDto) {
    const { email, password, firstName, lastName, userName } = payload;

    // const user = await
  }
}
