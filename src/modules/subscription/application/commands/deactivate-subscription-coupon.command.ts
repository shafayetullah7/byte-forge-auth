import { Injectable, NotFoundException } from '@nestjs/common';
import {
  toSubscriptionCouponResponse,
  type SubscriptionCouponResponse,
} from '../../mappers/subscription-coupon.mapper';
import { SubscriptionCouponRepository } from '../../repositories/subscription-coupon.repository';

@Injectable()
export class DeactivateSubscriptionCouponCommand {
  constructor(
    private readonly subscriptionCouponRepository: SubscriptionCouponRepository,
  ) {}

  async execute(id: string): Promise<SubscriptionCouponResponse> {
    const existing = await this.subscriptionCouponRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Subscription coupon not found');
    }

    const row = await this.subscriptionCouponRepository.deactivate(id);
    if (!row) {
      throw new NotFoundException('Subscription coupon not found');
    }

    return toSubscriptionCouponResponse(row);
  }
}
