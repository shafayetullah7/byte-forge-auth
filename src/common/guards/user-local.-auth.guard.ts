import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserAuthStrategyEnum } from '../enum/user.auth.strategy.enum';

@Injectable()
export class UserLocalAuthGuard extends AuthGuard(
  UserAuthStrategyEnum.LOCAL_USER,
) {}
