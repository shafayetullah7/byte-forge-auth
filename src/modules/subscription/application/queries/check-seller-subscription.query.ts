import { Injectable } from '@nestjs/common';
import { gt, inArray, type SQLWrapper } from 'drizzle-orm';
import { SubscriptionBillingProviderEnum } from '@/_db/drizzle/enum/subscription-billing-provider.enum';
import { shopSubscriptionsTable } from '@/_db/drizzle/schema/subscription/shop-subscriptions.schema';
import type { TShopSubscription } from '@/_db/drizzle/schema/subscription/shop-subscriptions.schema';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  computeStatus,
  isEntitlementActive,
  SubscriptionStatus,
} from '../../domain';
import type { SellerSubscriptionEntitlement } from '../../mappers/seller-subscription-entitlement.types';
import { ShopSubscriptionRepository } from '../../repositories/shop-subscription.repository';

/**
 * Cross-module read facade for catalog/order entitlement checks.
 */
@Injectable()
export class CheckSellerSubscriptionQuery {
  constructor(
    private readonly shopSubscriptionRepository: ShopSubscriptionRepository,
    private readonly db: DrizzleService,
  ) {}

  /**
   * Filter for public listings: shop has entitlement when current_period_end > now.
   * Uses IN + subquery (not correlated EXISTS) so Drizzle relational queries that
   * alias the shops table as "shopTable" still generate valid SQL.
   */
  shopHasActiveEntitlement(
    shopIdColumn: SQLWrapper,
    now: Date = new Date(),
  ) {
    return inArray(
      shopIdColumn,
      this.db.client
        .select({ shopId: shopSubscriptionsTable.shopId })
        .from(shopSubscriptionsTable)
        .where(gt(shopSubscriptionsTable.currentPeriodEnd, now)),
    );
  }

  async execute(
    shopId: string,
    now: Date = new Date(),
  ): Promise<SellerSubscriptionEntitlement> {
    const row = await this.shopSubscriptionRepository.findByShopId(shopId);
    return this.toEntitlement(row, now);
  }

  async executeMany(
    shopIds: string[],
    now: Date = new Date(),
  ): Promise<Map<string, SellerSubscriptionEntitlement>> {
    const uniqueShopIds = [...new Set(shopIds)];
    const result = new Map<string, SellerSubscriptionEntitlement>();

    if (uniqueShopIds.length === 0) {
      return result;
    }

    const rows = await this.shopSubscriptionRepository.findByShopIds(uniqueShopIds);
    const rowByShopId = new Map(rows.map((row) => [row.shopId, row]));

    for (const shopId of uniqueShopIds) {
      result.set(shopId, this.toEntitlement(rowByShopId.get(shopId) ?? null, now));
    }

    return result;
  }

  async filterEntitledShopIds(
    shopIds: string[],
    now: Date = new Date(),
  ): Promise<string[]> {
    const entitlements = await this.executeMany(shopIds, now);
    return shopIds.filter((shopId) => entitlements.get(shopId)?.active === true);
  }

  private toEntitlement(
    row: TShopSubscription | null,
    now: Date,
  ): SellerSubscriptionEntitlement {
    if (!row) {
      return {
        active: false,
        status: SubscriptionStatus.NONE,
        currentPeriodEnd: null,
        billingProvider: SubscriptionBillingProviderEnum.NONE,
      };
    }

    const status = computeStatus(row.currentPeriodEnd, now);
    const entitled = isEntitlementActive(row.currentPeriodEnd, now);

    return {
      active: entitled,
      status,
      currentPeriodEnd: row.currentPeriodEnd,
      billingProvider: row.billingProvider,
    };
  }
}
