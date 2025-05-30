import {
  Controller,
  Get,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Request } from 'express';
import { UserAuthGuard } from 'src/common/guards/user-auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(UserAuthGuard)
  @Get()
  async getUser(@Req() req: Request) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException('Unauthorized access');
    }

    const result = await this.userService.getUser(user.id);

    return { success: true, message: 'User retrieved', data: result.user };
  }
}
