import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, desc, eq, exists, ilike, or } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  ordersTable,
  userLocalAuthTable,
  userTable,
} from '@/_db/drizzle/schema';
import { paginate } from '@/common/utils/pagination.util';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import {
  GetAdminOrderStatsQuery,
  ListAdminOrdersQuery,
} from '@/modules/order/application/queries';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly db: DrizzleService,
    private readonly getAdminOrderStatsQuery: GetAdminOrderStatsQuery,
    private readonly listAdminOrdersQuery: ListAdminOrdersQuery,
  ) {}

  async listUsers(query: AdminUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;
    const isAsc = query.sortOrder === 'asc';
    const search = query.search?.trim();

    const conditions = [
      query.buyersOnly
        ? exists(
            this.db.client
              .select({ id: ordersTable.id })
              .from(ordersTable)
              .where(eq(ordersTable.userId, userTable.id)),
          )
        : undefined,
      search
        ? or(
            ilike(userTable.userName, `%${search}%`),
            ilike(userTable.firstName, `%${search}%`),
            ilike(userTable.lastName, `%${search}%`),
            ilike(userLocalAuthTable.email, `%${search}%`),
          )
        : undefined,
    ].filter(Boolean);

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ total }] = await this.db.client
      .select({ total: count() })
      .from(userTable)
      .leftJoin(userLocalAuthTable, eq(userLocalAuthTable.userId, userTable.id))
      .where(whereClause);

    const rows = await this.db.client
      .select({
        id: userTable.id,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        userName: userTable.userName,
        email: userLocalAuthTable.email,
        emailVerified: userTable.emailVerified,
        isActive: userTable.isActive,
        avatar: userTable.avatar,
        createdAt: userTable.createdAt,
      })
      .from(userTable)
      .leftJoin(userLocalAuthTable, eq(userLocalAuthTable.userId, userTable.id))
      .where(whereClause)
      .orderBy(
        query.sortBy === 'name'
          ? isAsc
            ? asc(userTable.firstName)
            : desc(userTable.firstName)
          : isAsc
            ? asc(userTable.createdAt)
            : desc(userTable.createdAt),
      )
      .limit(limit)
      .offset(offset);

    return paginate(
      rows.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
        email: user.email ?? null,
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

  async getUser(userId: string) {
    const [user] = await this.db.client
      .select({
        id: userTable.id,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        userName: userTable.userName,
        email: userLocalAuthTable.email,
        emailVerified: userTable.emailVerified,
        emailVerifiedAt: userTable.emailVerifiedAt,
        isActive: userTable.isActive,
        avatar: userTable.avatar,
        createdAt: userTable.createdAt,
        updatedAt: userTable.updatedAt,
      })
      .from(userTable)
      .leftJoin(userLocalAuthTable, eq(userLocalAuthTable.userId, userTable.id))
      .where(eq(userTable.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const orderStats = await this.getAdminOrderStatsQuery.execute({ userId });

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      email: user.email ?? null,
      emailVerified: user.emailVerified,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      isActive: user.isActive,
      avatar: user.avatar,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      orderStats,
    };
  }

  async getUserOrders(userId: string, lang: string) {
    return this.listAdminOrdersQuery.execute(
      {
        userId,
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
      lang,
    );
  }
}
