import { Injectable, NotFoundException } from '@nestjs/common';
import {
  toSubscriptionPlanResponse,
  type SubscriptionPlanResponse,
} from '../../mappers/subscription-plan.mapper';
import { SubscriptionPlanRepository } from '../../repositories/subscription-plan.repository';
import type { UpdateSubscriptionPlanDto } from '../../controllers/dto/update-subscription-plan.dto';

import type { SubscriptionPlanUpdateInput } from '../../repositories/subscription-plan.repository.types';

@Injectable()
export class UpdateSubscriptionPlanCommand {
  constructor(
    private readonly subscriptionPlanRepository: SubscriptionPlanRepository,
  ) {}

  async execute(
    id: string,
    dto: UpdateSubscriptionPlanDto,
  ): Promise<SubscriptionPlanResponse> {
    const existing = await this.subscriptionPlanRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Subscription plan not found');
    }

    const patch: SubscriptionPlanUpdateInput = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.interval !== undefined) patch.interval = dto.interval;
    if (dto.priceBdt !== undefined) patch.priceBdt = dto.priceBdt;
    if (dto.isActiveForNew !== undefined) {
      patch.isActiveForNew = dto.isActiveForNew;
    }
    if (dto.sortOrder !== undefined) patch.sortOrder = dto.sortOrder;

    const row = await this.subscriptionPlanRepository.update(id, patch);

    if (!row) {
      throw new NotFoundException('Subscription plan not found');
    }

    return toSubscriptionPlanResponse(row);
  }
}
