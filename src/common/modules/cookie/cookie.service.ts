import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Injectable()
export class CookieService {
  constructor(private readonly configService: ConfigService) {}

  setSessionCookie(res: Response, token: string) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    res.cookie('sessionId', token, {
      httpOnly: true,
      secure: isProduction,
      maxAge: this.configService.get<number>('SESSION_MAX_AGE') || 604800000, // 7 days default
      sameSite: isProduction ? 'strict' : 'lax',
      domain: isProduction
        ? this.configService.get('COOKIE_DOMAIN')
        : undefined,
      path: '/',
    });
  }
}
