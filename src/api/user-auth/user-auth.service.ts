import { Injectable } from '@nestjs/common';
import { DrizzleService } from 'src/drizzle/drizzle.service';
import { AuthUser } from './types/auth-user.type';
import { DeviceInfo } from 'src/drizzle/schema/user.session.schema';
import { UserSessionService } from '../user-session/user-session.service';

@Injectable()
export class UserAuthService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly userSessionService: UserSessionService,
  ) {}

  async login(payload: { user: AuthUser; deviceInfo: DeviceInfo; ip: string }) {
    const { user, deviceInfo, ip } = payload;

    const session = await this.userSessionService.createAuthSession({
      user,
      deviceInfo,
      ip,
    });

    return session;
  }
}
