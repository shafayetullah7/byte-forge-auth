import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { HashingService } from 'src/common/modules/hashing/hashing.service';
import { AdminLocalAuthService } from '../admin-local-auth.service';
import { AdminAuthStrategyEnum } from 'src/common/enum/admin.auth.strategy.enum';
import { AuthAccess } from 'src/common/types';

@Injectable()
export class AdminLocalStrategy extends PassportStrategy(
  Strategy,
  AdminAuthStrategyEnum.LOCAL_ADMIN,
) {
  constructor(
    private readonly authService: AdminLocalAuthService,
    private readonly hashingService: HashingService,
  ) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<AuthAccess> {
    const [admin] = await this.authService.getLocalAdmin({ email });

    if (!admin) {
      throw new NotFoundException('User not found');
    }

    const passMatch = await this.hashingService.compare(
      password,
      admin.adminLocalAuth.password,
    );

    if (!passMatch) {
      throw new BadRequestException('Invalid password');
    }

    return { ...admin, role: 'admin' };
  }
}
