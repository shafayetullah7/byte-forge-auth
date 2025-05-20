import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HashingService {
  private saltRounds: number;
  constructor(private readonly configService: ConfigService) {
    const saltRounds = this.configService.get<number>('SALT_ROUNDS');
    console.log('salt: ', { saltRounds });
    if (!saltRounds) {
      throw new InternalServerErrorException('Salt round not provided');
    }
    this.saltRounds = saltRounds;
  }

  async hash(plainText: string): Promise<string> {
    return await bcrypt.hash(plainText, this.saltRounds);
  }

  async compare(plainText: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(plainText, hash);
  }
}
