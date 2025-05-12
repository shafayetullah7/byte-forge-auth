import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { DrizzleClient } from 'src/drizzle/types';
import { NewUser, User, users } from 'src/drizzle/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UserService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleClient) {}

  async createUser(data: NewUser): Promise<User> {
    const existingUsers = await this.db
      .select()
      .from(users)
      .where(eq(users.email, data.email));

    if (existingUsers?.length) {
      throw new ConflictException('User already exists with the email');
    }

    const newUser = await this.db.insert(users).values(data).returning();
    if (!newUser.length) {
      throw new InternalServerErrorException('Failed to create user');
    }
    return newUser[0];
  }

  async getUsers(): Promise<User[]> {
    const allUsers = await this.db.select().from(users);
    return allUsers;
  }
}
