import { Injectable } from '@nestjs/common';
import { SubscriptionBillingProviderEnum } from '@/_db/drizzle/enum/subscription-billing-provider.enum';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';
import {
  computeStatus,
  isEntitlementActive,
  SubscriptionStatus,
} from '../../domain';
import type { SellerSubscriptionEntitlement } from '../../mappers/seller-subscription-entitlement.types';
import { ShopSubscriptionRepository } from '../../repositories/shop-subscription.repository';

/**
 * Cross-module read facade for catalog/order entitlement checks.
 * When enforcement is disabled, `active` is always true (no gating).
 */
@Injectable()
export class CheckSellerSubscriptionQuery {
  constructor(
    private readonly shopSubscriptionRepository: ShopSubscriptionRepository,
    private readonly appConfig: AppConfigService,
  ) {}

  async execute(
    shopId: string,
    now: Date = new Date(),
  ): Promise<SellerSubscriptionEntitlement> {
    const row = await this.shopSubscriptionRepository.findByShopId(shopId);
    const enforcementEnabled = this.appConfig.subscriptionEnforcementEnabled;

    if (!row) {
      return {
        active: enforcementEnabled ? false : true,
        status: SubscriptionStatus.NONE,
        currentPeriodEnd: null,
        billingProvider: SubscriptionBillingProviderEnum.NONE,
      };
    }

    const status = computeStatus(row.currentPeriodEnd, now);
    const entitled = isEntitlementActive(row.currentPeriodEnd, now);

    return {
      active: enforcementEnabled ? entitled : true,
      status,
      currentPeriodEnd: row.currentPeriodEnd,
      billingProvider: row.billingProvider,
    };
  }
}
