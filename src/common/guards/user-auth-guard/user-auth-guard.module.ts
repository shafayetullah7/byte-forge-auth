import { Global, Module } from '@nestjs/common';
import { UserAuthGuard } from './user-auth.guard';
import { AuthModule } from '@/modules/auth/auth.module';

@Global()
@Module({
  imports: [AuthModule],
  providers: [UserAuthGuard],
  exports: [UserAuthGuard, AuthModule],
})
export class UserAuthGuardModule {}
