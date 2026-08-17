import { Injectable } from '@nestjs/common';

@Injectable()
export class OtpService {
  /**
   * Generate a 6-digit numeric OTP (used by admin registration approval flow).
   */
  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
