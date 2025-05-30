import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UserLocalAuthService } from '../user-local-auth.service';
import { HashingService } from 'src/common/modules/hashing/hashing.service';
import { LocalUserAuth } from '../types/local-auth-user.type';
import { UserAuthStrategyEnum } from 'src/common/enum/user.auth.strategy.enum';

@Injectable()
export class UserLocalStrategy extends PassportStrategy(
  Strategy,
  UserAuthStrategyEnum.LOCAL_USER,
) {
  constructor(
    private readonly authService: UserLocalAuthService,
    private readonly hashingService: HashingService,
  ) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<LocalUserAuth> {
    const [user] = await this.authService.getLocalUser({ email });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passMatch = await this.hashingService.compare(
      password,
      user.userLocalAuth.password,
    );

    if (!passMatch) {
      throw new BadRequestException('Invalid password');
    }

    return user;
  }
}
