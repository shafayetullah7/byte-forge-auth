import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import type { DrizzleTx } from '@/libs/db/types';
import { UserRepository } from '../../repositories/user.repository';

@Injectable()
export class CreateUserCommand {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    payload: {
      userName: string;
      firstName: string;
      lastName: string;
      email?: string;
    },
    tx?: DrizzleTx,
  ) {
    const existing = await this.userRepository.findOne(
      { userName: payload.userName },
      tx ? { tx, lock: false } : undefined,
    );

    if (existing) {
      throw new ConflictException('username already exists');
    }

    const newUser = await this.userRepository.create(
      {
        firstName: payload.firstName,
        lastName: payload.lastName,
        userName: payload.userName,
        email: payload.email,
      },
      tx,
    );

    if (!newUser) {
      throw new InternalServerErrorException('Failed to create user');
    }

    return newUser;
  }
}
