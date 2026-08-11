import { Injectable } from '@nestjs/common';
import { and, count, desc, eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { shopFollowsTable } from '@/_db/drizzle/schema/shop';

@Injectable()
export class ShopFollowRepository {
  constructor(private readonly db: DrizzleService) {}

  async follow(shopId: string, userId: string) {
    const [row] = await this.db.client
      .insert(shopFollowsTable)
      .values({ shopId, userId })
      .onConflictDoNothing()
      .returning();
    if (row) return row;
    return this.db.client.query.shopFollowsTable.findFirst({
      where: and(
        eq(shopFollowsTable.shopId, shopId),
        eq(shopFollowsTable.userId, userId),
      ),
    });
  }

  async unfollow(shopId: string, userId: string) {
    return this.db.client
      .delete(shopFollowsTable)
      .where(
        and(
          eq(shopFollowsTable.shopId, shopId),
          eq(shopFollowsTable.userId, userId),
        ),
      )
      .returning();
  }

  isFollowing(shopId: string, userId: string) {
    return this.db.client.query.shopFollowsTable.findFirst({
      where: and(
        eq(shopFollowsTable.shopId, shopId),
        eq(shopFollowsTable.userId, userId),
      ),
      columns: { id: true },
    });
  }

  async countByShopId(shopId: string) {
    const [row] = await this.db.client
      .select({ total: count() })
      .from(shopFollowsTable)
      .where(eq(shopFollowsTable.shopId, shopId));
    return row?.total ?? 0;
  }

  listFollowingByUserId(userId: string) {
    return this.db.client.query.shopFollowsTable.findMany({
      where: eq(shopFollowsTable.userId, userId),
      orderBy: desc(shopFollowsTable.createdAt),
      with: {
        shop: {
          with: { translations: true, logo: true, banner: true },
        },
      },
    });
  }
}
