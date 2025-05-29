import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UserLocalAuthService } from '../user-local-auth.service';
import { HashingService } from 'src/common/modules/hashing/hashing.service';
import { AuthUser } from '../../../../common/types/auth-user.type';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(
    private readonly authService: UserLocalAuthService,
    private readonly hashingService: HashingService,
  ) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<AuthUser> {
    const [user] = await this.authService.getLocalUser({ email });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passMatch = await this.hashingService.compare(
      password,
      user.localAuth.password,
    );

    if (!passMatch) {
      throw new BadRequestException('Invalid password');
    }

    return user;
  }
}
