import { forwardRef, Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { OrderModule } from '@/modules/order/order.module';
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
  GetAdminUserQuery,
  GetProfileQuery,
  ListAdminUsersQuery,
  UserQueryService,
} from './application/queries';
import {
  AdminUsersController,
  BuyerAddressesController,
  UserProfileController,
} from './controllers';
import { UserAddressRepository, UserRepository } from './repositories';

@Module({
  imports: [DrizzleModule, forwardRef(() => OrderModule)],
  controllers: [
    UserProfileController,
    BuyerAddressesController,
    AdminUsersController,
  ],
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
    ListAdminUsersQuery,
    GetAdminUserQuery,
  ],
  exports: [UserQueryService, CreateUserCommand],
})
export class UserModule {}
