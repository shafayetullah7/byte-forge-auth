import { Injectable, NotFoundException } from '@nestjs/common';
import { GetAdminOrderStatsQuery } from '@/modules/order/application/queries';
import { UserRepository } from '../../repositories/user.repository';

@Injectable()
export class GetAdminUserQuery {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly getAdminOrderStatsQuery: GetAdminOrderStatsQuery,
  ) {}

  async execute(userId: string) {
    const user = await this.userRepository.findAdminProfile(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const orderStats = await this.getAdminOrderStatsQuery.execute({ userId });

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      email: user.email,
      emailVerified: user.emailVerified,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      isActive: user.isActive,
      avatar: user.avatar,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      orderStats,
    };
  }
}
