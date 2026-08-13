import { Injectable } from '@nestjs/common';
import {
  toSellerSubscriptionResponse,
  type SellerSubscriptionResponse,
} from '../../mappers/seller-subscription.mapper';
import { toSubscriptionPlanResponse } from '../../mappers/subscription-plan.mapper';
import { ShopSubscriptionRepository } from '../../repositories/shop-subscription.repository';
import { SubscriptionPlanRepository } from '../../repositories/subscription-plan.repository';

@Injectable()
export class GetSellerSubscriptionQuery {
  constructor(
    private readonly shopSubscriptionRepository: ShopSubscriptionRepository,
    private readonly subscriptionPlanRepository: SubscriptionPlanRepository,
  ) {}

  async execute(
    shopId: string,
    now: Date = new Date(),
  ): Promise<SellerSubscriptionResponse> {
    const [subscription, planRows] = await Promise.all([
      this.shopSubscriptionRepository.findByShopId(shopId),
      this.subscriptionPlanRepository.findAll({ activeForNewOnly: true }),
    ]);

    const availablePlans = planRows.map(toSubscriptionPlanResponse);

    return toSellerSubscriptionResponse(subscription, availablePlans, now);
  }
}
