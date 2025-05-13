import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { NewUser, User, users } from 'src/drizzle/schema';
import { eq } from 'drizzle-orm';
import { UpdateUserBodyDto } from './dto/update.user.dto';
import { DrizzleService } from 'src/drizzle/drizzle.service';

@Injectable()
export class UserService {
  constructor(private readonly drizzle: DrizzleService) {}

  async createUser(data: NewUser): Promise<User> {
    const existingUsers = await this.drizzle.client
      .select()
      .from(users)
      .where(eq(users.email, data.email));

    if (existingUsers?.length) {
      throw new ConflictException('User already exists with the email');
    }

    const newUser = await this.drizzle.client
      .insert(users)
      .values(data)
      .returning();
    if (!newUser.length) {
      throw new InternalServerErrorException('Failed to create user');
    }
    return newUser[0];
  }

  async getUsers(): Promise<User[]> {
    const allUsers = await this.drizzle.client.select().from(users);
    return allUsers;
  }

  async updateUser(userId: string, data: UpdateUserBodyDto) {
    console.log({ userId, data });
    const [user] = await this.drizzle.client
      .select()
      .from(users)
      .where(eq(users.id, userId));

    console.log({ user });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [updatedUser] = await this.drizzle.client
      .update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new InternalServerErrorException('Failed to update user');
    }
    return updatedUser;
  }

  async deleteUser(userId: string) {
    const [user] = await this.drizzle.client
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [deletedUser] = await this.drizzle.client
      .delete(users)
      .where(eq(users.id, userId))
      .returning();

    return deletedUser;
  }
}
