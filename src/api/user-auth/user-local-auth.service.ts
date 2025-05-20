import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { DrizzleService } from 'src/drizzle/drizzle.service';
import { GetLocalUserQueryDto } from './dto/get-local-user.dto';
import { User, UserLocalAuth } from 'src/drizzle/schema';
import { and, eq, SQL } from 'drizzle-orm';
import { DrizzlePgTransaction } from 'src/drizzle/types';
import { UserService } from '../user/user.service';
import { HashingService } from 'src/common/modules/hashing/hashing.service';

@Injectable()
export class UserLocalAuthService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly userService: UserService,
    private readonly hashingService: HashingService,
  ) {}

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

  // async createUser(payload: {
  //   userName: string;
  //   firstName: string;
  //   lastName: string;
  // }) {
  //   const [user] = await this.drizzle.client
  //     .select()
  //     .from(User)
  //     .where(eq(User.userName, payload.userName))
  //     .execute();

  //   if (user) {
  //     throw new ConflictException('username already exists');
  //   }

  //   const [newUser] = await this.drizzle.client
  //     .insert(User)
  //     .values({
  //       firstName: payload.firstName,
  //       lastName: payload.lastName,
  //       userName: payload.userName,
  //     })
  //     .returning()
  //     .execute();

  //   return newUser;
  // }

  async createUserLocalAuth(
    payload: { userId: string; email: string; password: string },
    tx?: DrizzlePgTransaction,
  ) {
    const hashedPass = await this.hashingService.hash(payload.password);
    const db = tx || this.drizzle.client;

    const [existingLocalAuth] = await db
      .select()
      .from(UserLocalAuth)
      .where(eq(UserLocalAuth.email, payload.email))
      .execute();

    if (existingLocalAuth) {
      throw new ConflictException('Auth record already exitst with the email');
    }

    const [localAuth] = await db
      .insert(UserLocalAuth)
      .values({
        email: payload.email,
        password: hashedPass,
        userId: payload.userId,
      })
      .returning()
      .execute();

    if (!localAuth) {
      throw new InternalServerErrorException('Failed to create local auth');
    }
    return localAuth;
  }
}
