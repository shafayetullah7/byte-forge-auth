import { Global, Module } from '@nestjs/common';
import { UserAuthGuard } from './user-auth.guard';
import { AuthModule } from '@/modules/auth/auth.module';
import { JwtResourceGuardModule } from '@/libs/auth/jwt-resource.guard.module';

@Global()
@Module({
  imports: [AuthModule, JwtResourceGuardModule],
  providers: [UserAuthGuard],
  exports: [UserAuthGuard, AuthModule, JwtResourceGuardModule],
})
export class UserAuthGuardModule {}
