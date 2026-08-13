import { Injectable } from '@nestjs/common';
import type { CreateSubscriptionPlanDto } from '../../controllers/dto/create-subscription-plan.dto';
import {
  toSubscriptionPlanResponse,
  type SubscriptionPlanResponse,
} from '../../mappers/subscription-plan.mapper';
import { SubscriptionPlanRepository } from '../../repositories/subscription-plan.repository';

@Injectable()
export class CreateSubscriptionPlanCommand {
  constructor(
    private readonly subscriptionPlanRepository: SubscriptionPlanRepository,
  ) {}

  async execute(
    dto: CreateSubscriptionPlanDto,
  ): Promise<SubscriptionPlanResponse> {
    const row = await this.subscriptionPlanRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      interval: dto.interval,
      priceBdt: dto.priceBdt,
      sortOrder: dto.sortOrder ?? 0,
      isActiveForNew: true,
      isRetired: false,
    });

    return toSubscriptionPlanResponse(row);
  }
}
