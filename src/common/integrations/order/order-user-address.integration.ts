import { Injectable } from '@nestjs/common';
import { UserAddressRepository } from '@/_repositories/user/user-address.repository';

@Injectable()
export class OrderUserAddressIntegration {
  constructor(private readonly addressRepository: UserAddressRepository) {}

  findById(addressId: string) {
    return this.addressRepository.findById(addressId);
  }
}
