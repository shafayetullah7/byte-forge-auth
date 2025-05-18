import { Module } from '@nestjs/common';
import { UserAuthService } from './user-auth.service';
import { UserAuthController } from './user-auth.controller';
import { UserLocalAuthService } from './user-local-auth.service';
import { HashingModule } from 'src/common/modules/hashing/hashing.module';

@Module({
  imports: [HashingModule],
  controllers: [UserAuthController],
  providers: [UserAuthService, UserLocalAuthService],
})
export class UserAuthModule {}
