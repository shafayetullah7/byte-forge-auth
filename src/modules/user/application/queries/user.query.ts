import { Injectable } from '@nestjs/common';
import {
  UserAddressRepository,
  UserRepository,
  UserSummary,
} from '../../repositories';

/**
 * Cross-module read facade for order, auth, and other callers.
 */
@Injectable()
export class UserQueryService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userAddressRepository: UserAddressRepository,
  ) {}

  getUserSummaries(ids: string[]): Promise<UserSummary[]> {
    return this.userRepository.findSummariesByIds(ids);
  }

  findByUserName(userName: string) {
    return this.userRepository.findOne({ userName });
  }

  findById(
    id: string,
    transaction?: Parameters<UserRepository['findById']>[1],
  ) {
    return this.userRepository.findById(id, transaction);
  }

  getAddressById(addressId: string) {
    return this.userAddressRepository.findById(addressId);
  }
}

export type { UserSummary };
