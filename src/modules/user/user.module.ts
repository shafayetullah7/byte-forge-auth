import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import {
  CreateAddressCommand,
  CreateUserCommand,
  DeleteAddressCommand,
  SetDefaultAddressCommand,
  UpdateAddressCommand,
} from './application/commands';
import {
  GetAddressByIdQuery,
  GetAddressesQuery,
  GetProfileQuery,
  UserQueryService,
} from './application/queries';
import { BuyerAddressesController, UserProfileController } from './controllers';
import { UserAddressRepository, UserRepository } from './repositories';

@Module({
  imports: [DrizzleModule],
  controllers: [UserProfileController, BuyerAddressesController],
  providers: [
    UserRepository,
    UserAddressRepository,
    UserQueryService,
    CreateUserCommand,
    GetProfileQuery,
    CreateAddressCommand,
    GetAddressesQuery,
    GetAddressByIdQuery,
    UpdateAddressCommand,
    DeleteAddressCommand,
    SetDefaultAddressCommand,
  ],
  exports: [UserQueryService, CreateUserCommand],
})
export class UserModule {}
