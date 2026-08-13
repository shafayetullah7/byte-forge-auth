import { Injectable, NotFoundException } from '@nestjs/common';
import {
  toSubscriptionCouponResponse,
  type SubscriptionCouponResponse,
} from '../../mappers/subscription-coupon.mapper';
import { SubscriptionCouponRepository } from '../../repositories/subscription-coupon.repository';

@Injectable()
export class GetSubscriptionCouponQuery {
  constructor(
    private readonly subscriptionCouponRepository: SubscriptionCouponRepository,
  ) {}

  async execute(id: string): Promise<SubscriptionCouponResponse> {
    const row = await this.subscriptionCouponRepository.findById(id);
    if (!row) {
      throw new NotFoundException('Subscription coupon not found');
    }

    return toSubscriptionCouponResponse(row);
  }
}
