import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { UserAuthService } from './user-auth.service';
import { LocalAuthGuard } from 'src/common/guards/local.-auth.guard';
import { Request } from 'express';

@Controller('user-auth')
export class UserAuthController {
  constructor(private readonly userAuthService: UserAuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req: Request) {
    const user = req.user;
    console.log(user);
  }
}
