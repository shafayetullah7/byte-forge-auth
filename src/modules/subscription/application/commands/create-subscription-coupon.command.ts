import { BadRequestException, Injectable } from '@nestjs/common';
import type { CreateSubscriptionCouponDto } from '../../controllers/dto/create-subscription-coupon.dto';
import {
  toSubscriptionCouponResponse,
  type SubscriptionCouponResponse,
} from '../../mappers/subscription-coupon.mapper';
import { SubscriptionCouponRepository } from '../../repositories/subscription-coupon.repository';

@Injectable()
export class CreateSubscriptionCouponCommand {
  constructor(
    private readonly subscriptionCouponRepository: SubscriptionCouponRepository,
  ) {}

  async execute(
    dto: CreateSubscriptionCouponDto,
  ): Promise<SubscriptionCouponResponse> {
    const normalizedCode = dto.code.trim().toUpperCase();
    const existing =
      await this.subscriptionCouponRepository.findByCode(normalizedCode);

    if (existing) {
      throw new BadRequestException(
        `Subscription coupon with code '${normalizedCode}' already exists`,
      );
    }

    const row = await this.subscriptionCouponRepository.create({
      code: normalizedCode,
      durationValue: dto.durationValue,
      durationUnit: dto.durationUnit,
      maxRedemptions: dto.maxRedemptions ?? null,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      isActive: true,
    });

    return toSubscriptionCouponResponse(row);
  }
}
