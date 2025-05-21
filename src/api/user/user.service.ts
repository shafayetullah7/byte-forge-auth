import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from 'src/drizzle/drizzle.service';
import { User } from 'src/drizzle/schema';
import { DrizzlePgTransaction } from 'src/drizzle/types';

@Injectable()
export class UserService {
  constructor(private readonly drizzle: DrizzleService) {}

  async createUser(
    payload: {
      userName: string;
      firstName: string;
      lastName: string;
    },
    tx?: DrizzlePgTransaction,
  ) {
    const db = tx || this.drizzle.client;

    const [user] = await db
      .select()
      .from(User)
      .where(eq(User.userName, payload.userName))
      .execute();

    if (user) {
      throw new ConflictException('username already exists');
    }

    const [newUser] = await db
      .insert(User)
      .values({
        firstName: payload.firstName,
        lastName: payload.lastName,
        userName: payload.userName,
      })
      .returning()
      .execute();

    if (!newUser) {
      throw new InternalServerErrorException('Failed to create user');
    }

    return newUser;
  }

  async getUser(userId: string) {
    const [user] = await this.drizzle.client
      .select({
        user: {
          ...User,
        },
      })
      .from(User)
      .where(eq(User.id, userId))
      .execute();

    if (!user) throw new NotFoundException('User not found');

    return user;
  }
}
