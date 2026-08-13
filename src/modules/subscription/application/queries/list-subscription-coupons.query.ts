import { Injectable } from '@nestjs/common';
import {
  toSubscriptionCouponResponse,
  type SubscriptionCouponResponse,
} from '../../mappers/subscription-coupon.mapper';
import { SubscriptionCouponRepository } from '../../repositories/subscription-coupon.repository';
import type { ListSubscriptionCouponsQueryDto } from '../../controllers/dto/list-subscription-coupons-query.dto';

@Injectable()
export class ListSubscriptionCouponsQuery {
  constructor(
    private readonly subscriptionCouponRepository: SubscriptionCouponRepository,
  ) {}

  async execute(
    query: ListSubscriptionCouponsQueryDto,
  ): Promise<SubscriptionCouponResponse[]> {
    const rows = await this.subscriptionCouponRepository.findAll({
      search: query.search,
      isActive: query.isActive,
    });

    return rows.map(toSubscriptionCouponResponse);
  }
}
