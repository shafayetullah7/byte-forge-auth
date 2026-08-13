import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UpdateSubscriptionCouponDto } from '../../controllers/dto/update-subscription-coupon.dto';
import {
  toSubscriptionCouponResponse,
  type SubscriptionCouponResponse,
} from '../../mappers/subscription-coupon.mapper';
import { SubscriptionCouponRepository } from '../../repositories/subscription-coupon.repository';
import type { SubscriptionCouponUpdateInput } from '../../repositories/subscription-coupon.repository.types';

@Injectable()
export class UpdateSubscriptionCouponCommand {
  constructor(
    private readonly subscriptionCouponRepository: SubscriptionCouponRepository,
  ) {}

  async execute(
    id: string,
    dto: UpdateSubscriptionCouponDto,
  ): Promise<SubscriptionCouponResponse> {
    const existing = await this.subscriptionCouponRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Subscription coupon not found');
    }

    if (dto.code) {
      const normalizedCode = dto.code.trim().toUpperCase();
      const duplicate =
        await this.subscriptionCouponRepository.findByCode(normalizedCode);
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException(
          `Subscription coupon with code '${normalizedCode}' already exists`,
        );
      }
    }

    const patch: SubscriptionCouponUpdateInput = {};
    if (dto.code !== undefined) patch.code = dto.code;
    if (dto.durationValue !== undefined) patch.durationValue = dto.durationValue;
    if (dto.durationUnit !== undefined) patch.durationUnit = dto.durationUnit;
    if (dto.maxRedemptions !== undefined) {
      patch.maxRedemptions = dto.maxRedemptions;
    }
    if (dto.validFrom !== undefined) {
      patch.validFrom = dto.validFrom ? new Date(dto.validFrom) : null;
    }
    if (dto.validUntil !== undefined) {
      patch.validUntil = dto.validUntil ? new Date(dto.validUntil) : null;
    }
    if (dto.isActive !== undefined) patch.isActive = dto.isActive;

    const row = await this.subscriptionCouponRepository.update(id, patch);
    if (!row) {
      throw new NotFoundException('Subscription coupon not found');
    }

    return toSubscriptionCouponResponse(row);
  }
}
