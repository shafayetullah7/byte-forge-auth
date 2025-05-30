import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { Request } from 'express';
import { UserAuthGuard } from 'src/common/guards/user-auth.guard';
import { AuthenticUserParam } from 'src/common/pipes/authentic-user.pipe';
import { AuthenticUser } from 'src/common/types';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(UserAuthGuard)
  @Get()
  async getUser(@AuthenticUserParam() userAuth: AuthenticUser) {
    const { user } = userAuth;

    const result = await this.userService.getUser(user.id);

    return { success: true, message: 'User retrieved', data: result.user };
  }
}
