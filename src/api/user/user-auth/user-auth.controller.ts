import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserAuthService } from './user-auth.service';
import { LocalAuthGuard } from 'src/common/guards/user-local.-auth.guard';
import { Request, Response } from 'express';
import { parseDeviceInfo } from 'src/common/utils/get-divice-info';
import { getClientIp } from 'src/common/utils/get-client-ip';
import { CreateLocalUserDto } from './dto/create-local-user.dto';
import { CookieService } from 'src/common/modules/cookie/cookie.service';
import { UserAuthGuard } from 'src/common/guards/user-auth.guard';

@Controller('user/auth')
export class UserAuthController {
  constructor(
    private readonly userAuthService: UserAuthService,
    private readonly cookieService: CookieService,
  ) {}

  @Post('register')
  async register(@Body() payload: CreateLocalUserDto) {
    const result = await this.userAuthService.register(payload);
    return { success: true, message: 'New user created', data: { ...result } };
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user;

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userAgent = req.headers['user-agent'] || '';
    const deviceInfo = parseDeviceInfo(userAgent);
    const ip = getClientIp(req);
    const result = await this.userAuthService.login({
      userAuth: user,
      deviceInfo,
      ip,
    });

    // console.log

    this.cookieService.setSessionCookie(res, result.id);

    return {
      success: true,
      message: 'User logged in',
      data: {
        session: result,
      },
    };
  }

  @UseGuards(UserAuthGuard)
  @Get('/check')
  checkAuth(@Req() req: Request) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException('Unauthorized access');
    }
    delete user.localAuth;
    return user;
  }
}
