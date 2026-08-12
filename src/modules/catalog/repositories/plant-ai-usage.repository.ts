import { Injectable } from '@nestjs/common';
import { eq, sql, sum } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { plantAiUsageTable } from '@/_db/drizzle/schema/products/plant-ai-usage.schema';

export type PlantAiDailyUsageStats = {
  usageDate: string;
  totalRequests: number;
  totalSuccesses: number;
  totalErrors: number;
  activeShops: number;
  errorRate: number;
};

/** UTC calendar date string (YYYY-MM-DD). */
export function utcPlantAiUsageDate(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

@Injectable()
export class PlantAiUsageRepository {
  constructor(private readonly db: DrizzleService) {}

  /**
   * Atomically reserves one daily generation slot for the shop.
   * @returns The new request count after increment.
   */
  async reserveDailySlot(shopId: string, usageDate = utcPlantAiUsageDate()): Promise<number> {
    const [row] = await this.db.client
      .insert(plantAiUsageTable)
      .values({
        shopId,
        usageDate,
        requestCount: 1,
      })
      .onConflictDoUpdate({
        target: [plantAiUsageTable.shopId, plantAiUsageTable.usageDate],
        set: {
          requestCount: sql`${plantAiUsageTable.requestCount} + 1`,
          updatedAt: new Date(),
        },
      })
      .returning({ requestCount: plantAiUsageTable.requestCount });

    return row?.requestCount ?? 1;
  }

  async recordOutcome(
    shopId: string,
    outcome: 'success' | 'error',
    usageDate = utcPlantAiUsageDate(),
  ): Promise<void> {
    if (outcome === 'success') {
      await this.db.client
        .update(plantAiUsageTable)
        .set({
          successCount: sql`${plantAiUsageTable.successCount} + 1`,
          updatedAt: new Date(),
        })
        .where(
          sql`${plantAiUsageTable.shopId} = ${shopId} AND ${plantAiUsageTable.usageDate} = ${usageDate}`,
        );
      return;
    }

    await this.db.client
      .update(plantAiUsageTable)
      .set({
        errorCount: sql`${plantAiUsageTable.errorCount} + 1`,
        updatedAt: new Date(),
      })
      .where(
        sql`${plantAiUsageTable.shopId} = ${shopId} AND ${plantAiUsageTable.usageDate} = ${usageDate}`,
      );
  }

  async getDailyAggregateStats(
    usageDate = utcPlantAiUsageDate(),
  ): Promise<PlantAiDailyUsageStats> {
    const [row] = await this.db.client
      .select({
        totalRequests: sum(plantAiUsageTable.requestCount),
        totalSuccesses: sum(plantAiUsageTable.successCount),
        totalErrors: sum(plantAiUsageTable.errorCount),
        activeShops: sql<number>`count(*)::int`,
      })
      .from(plantAiUsageTable)
      .where(eq(plantAiUsageTable.usageDate, usageDate));

    const totalRequests = Number(row?.totalRequests ?? 0);
    const totalSuccesses = Number(row?.totalSuccesses ?? 0);
    const totalErrors = Number(row?.totalErrors ?? 0);
    const completed = totalSuccesses + totalErrors;

    return {
      usageDate,
      totalRequests,
      totalSuccesses,
      totalErrors,
      activeShops: row?.activeShops ?? 0,
      errorRate: completed > 0 ? totalErrors / completed : 0,
    };
  }
}
