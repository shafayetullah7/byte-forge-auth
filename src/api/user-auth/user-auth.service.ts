import { Injectable } from '@nestjs/common';
import { DrizzleService } from 'src/drizzle/drizzle.service';
import { AuthUser } from './types/auth-user.type';

@Injectable()
export class UserAuthService {
  constructor(private readonly drizzle: DrizzleService) {}

  async login(user: AuthUser) {}
}
