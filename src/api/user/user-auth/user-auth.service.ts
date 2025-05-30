import { Injectable } from '@nestjs/common';
import { DrizzleService } from 'src/drizzle/drizzle.service';
import { LocalUserAuth } from './types/local-auth-user.type';
import { UserSessionService } from '../user-session/user-session.service';
import { CreateLocalUserDto } from './dto/create-local-user.dto';
import { UserLocalAuthService } from './user-local-auth.service';
import { UserService } from '../user/user.service';
import { DeviceInfo } from 'src/drizzle/schema';

@Injectable()
export class UserAuthService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly userSessionService: UserSessionService,
    private readonly userLocalAuthService: UserLocalAuthService,
    private readonly userService: UserService,
  ) {}

  async register(payload: CreateLocalUserDto) {
    const { email, password, firstName, lastName, userName } = payload;

    const result = await this.drizzle.client.transaction(async (tx) => {
      const user = await this.userService.createUser(
        {
          firstName,
          lastName,
          userName,
        },
        tx,
      );
      const localAuth = await this.userLocalAuthService.createUserLocalAuth(
        { email, password, userId: user.id },
        tx,
      );

      return { user, localAuth };
    });

    return result;
  }

  async login(payload: {
    userAuth: LocalUserAuth;
    deviceInfo: DeviceInfo;
    ip: string;
  }) {
    const { userAuth, deviceInfo, ip } = payload;

    const session = await this.userSessionService.createAuthSession({
      userAuth,
      deviceInfo,
      ip,
    });

    return session;
  }
}
