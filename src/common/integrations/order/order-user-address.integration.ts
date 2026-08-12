import { Injectable } from '@nestjs/common';
import { UserQueryService } from '@/modules/user/application/queries/user.query';

@Injectable()
export class OrderUserAddressIntegration {
  constructor(private readonly userQueryService: UserQueryService) {}

  findById(addressId: string) {
    return this.userQueryService.getAddressById(addressId);
  }
}
