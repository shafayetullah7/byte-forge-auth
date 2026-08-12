import { Injectable } from '@nestjs/common';
import { eq, desc, count } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { shopVerificationTable } from '@/_db/drizzle/schema';
import { ShopVerificationStatusEnum } from '@/_db/drizzle/enum';
import { PaginationParams } from '@/libs/schemas/pagination.schema';
import { paginate } from '@/libs/utils/pagination.util';

@Injectable()
export class GetPendingVerificationsQuery {
  constructor(private readonly db: DrizzleService) {}

  async execute(query: PaginationParams) {
    const { limit = 20, page = 1 } = query;
    const offset = (page - 1) * limit;

    const whereClause = eq(
      shopVerificationTable.status,
      ShopVerificationStatusEnum.PENDING,
    );

    const [data, [{ total }]] = await Promise.all([
      this.db.client.query.shopVerificationTable.findMany({
        where: whereClause,
        with: {
          shop: {
            with: {
              translations: true,
            },
          },
        },
        limit,
        offset,
        orderBy: desc(shopVerificationTable.createdAt),
      }),
      this.db.client
        .select({ total: count() })
        .from(shopVerificationTable)
        .where(whereClause)
        .execute(),
    ]);

    return paginate(data, total, page, limit);
  }
}
