import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { CookieService } from '../modules/cookie/cookie.service';
import { USER_XSRF_COOKIE } from '../security/csrf';

const GUEST_TOKEN_COOKIE = 'guestToken';
const GUEST_TOKEN_MAX_AGE = 90 * 24 * 60 * 60 * 1000; // 90 days

@Injectable()
export class GuestTokenMiddleware implements NestMiddleware {
  constructor(private readonly cookieService: CookieService) {}

  use(req: Request, res: Response, next: NextFunction) {
    let token = req.cookies?.[GUEST_TOKEN_COOKIE] as string | undefined;

    if (!token) {
      token = randomUUID();
      res.cookie(GUEST_TOKEN_COOKIE, token, {
        ...this.cookieService.getGuestTokenCookieOptions(),
        maxAge: GUEST_TOKEN_MAX_AGE,
      });
    }

    (req as Request & { guestToken: string }).guestToken = token;

    const xsrfToken = req.cookies?.[USER_XSRF_COOKIE] as string | undefined;
    if (!xsrfToken) {
      this.cookieService.setUserXsrfToken(res, randomUUID());
    }

    next();
  }
}
