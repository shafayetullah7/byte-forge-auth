import { AuthGuard } from '@nestjs/passport';
import { AdminAuthStrategyEnum } from '../enum/admin.auth.strategy.enum';

export class AdminLocalAuthGuard extends AuthGuard(
  AdminAuthStrategyEnum.LOCAL_ADMIN,
) {}
