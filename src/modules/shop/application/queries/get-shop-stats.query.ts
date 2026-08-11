import { Injectable } from '@nestjs/common';
import { eq, sql, count } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { shopTable, shopVerificationTable } from '@/_db/drizzle/schema';
import { ShopStatusEnum, ShopVerificationStatusEnum } from '@/_db/drizzle/enum';

@Injectable()
export class GetShopStatsQuery {
  constructor(private readonly db: DrizzleService) {}

  async execute() {
    const [stats, verificationCount] = await Promise.all([
      this.db.client
        .select({
          totalShops: count(),
          pendingShops:
            sql<number>`SUM(CASE WHEN ${shopTable.status} = ${ShopStatusEnum.PENDING_VERIFICATION} THEN 1 ELSE 0 END)`.mapWith(
              Number,
            ),
          activeShops:
            sql<number>`SUM(CASE WHEN ${shopTable.status} = ${ShopStatusEnum.ACTIVE} THEN 1 ELSE 0 END)`.mapWith(
              Number,
            ),
          suspendedShops:
            sql<number>`SUM(CASE WHEN ${shopTable.status} = ${ShopStatusEnum.SUSPENDED} THEN 1 ELSE 0 END)`.mapWith(
              Number,
            ),
          inactiveShops:
            sql<number>`SUM(CASE WHEN ${shopTable.status} = ${ShopStatusEnum.INACTIVE} THEN 1 ELSE 0 END)`.mapWith(
              Number,
            ),
        })
        .from(shopTable),
      this.db.client
        .select({ total: count() })
        .from(shopVerificationTable)
        .where(
          eq(shopVerificationTable.status, ShopVerificationStatusEnum.PENDING),
        ),
    ]);

    const stat = stats[0];

    return {
      totalShops: stat?.totalShops || 0,
      pendingShops: stat?.pendingShops || 0,
      activeShops: stat?.activeShops || 0,
      suspendedShops: stat?.suspendedShops || 0,
      inactiveShops: stat?.inactiveShops || 0,
      pendingVerifications: verificationCount[0]?.total || 0,
    };
  }
}
