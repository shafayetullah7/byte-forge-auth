import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { HashingModule } from '../hashing/hashing.module';

@Module({
  imports: [HashingModule],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
