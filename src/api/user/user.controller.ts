import { Body, Controller, Get, Post, UsePipes } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create.user.dto';
import { ZodValidationPipe } from 'src/common/pipes/zod.validation.pipe';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UsePipes(ZodValidationPipe)
  async createUser(@Body() payload: CreateUserDto) {
    const user = await this.userService.createUser(payload);
    return user;
  }

  @Get()
  async getUsers() {
    return await this.userService.getUsers();
  }
}
