import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UsePipes,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create.user.dto';
import { ZodValidationPipe } from 'src/common/pipes/zod.validation.pipe';
import { UserIdParamsDto } from './dto/user.id.prams.dto';
import { UpdateUserBodyDto } from './dto/update.user.dto';

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
    const result = await this.userService.getUsers();

    return {
      success: true,
      message: 'Users retrieved',
      data: {
        users: result,
      },
    };
  }

  @Patch(':id')
  async updateUser(
    @Param() param: UserIdParamsDto,
    @Body() payload: UpdateUserBodyDto,
  ) {
    // console.log({ param });
    const { id } = param;
    const result = await this.userService.updateUser(id, payload);

    return {
      success: true,
      message: 'User update',
      data: {
        users: result,
      },
    };
  }

  @Delete(':id')
  async deleteUser(@Param() param: UserIdParamsDto) {
    const result = await this.userService.deleteUser(param.id);

    return {
      success: true,
      message: 'User deleted',
      data: {
        users: result,
      },
    };
  }
}
