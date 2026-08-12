import { Injectable } from '@nestjs/common';
import { paginate } from '@/common/utils/pagination.util';
import { AdminUsersQueryDto } from '../../controllers/dto/admin-users-query.dto';
import { UserRepository } from '../../repositories/user.repository';

@Injectable()
export class ListAdminUsersQuery {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: AdminUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const { rows, total } = await this.userRepository.listForAdmin({
      page,
      limit,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
      buyersOnly: query.buyersOnly,
      search: query.search,
    });

    return paginate(
      rows.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
        email: user.email,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
        avatar: user.avatar,
        createdAt: user.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    );
  }
}
