import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create.user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() payload: CreateUserDto) {
    const user = await this.userService.createUser(payload);
    return user;
  }

  @Get()
  async getUsers() {
    return await this.userService.getUsers();
  }
}
