import { Module } from '@nestjs/common';
import { JwtResourceGuardModule } from '@/libs/auth/jwt-resource.guard.module';
import { ResponseModule } from '@/libs/modules/response/response.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { OidcExampleController } from './oidc-example.controller';

@Module({
  imports: [JwtResourceGuardModule, ResponseModule, AuthModule],
  controllers: [OidcExampleController],
})
export class OidcExampleModule {}
