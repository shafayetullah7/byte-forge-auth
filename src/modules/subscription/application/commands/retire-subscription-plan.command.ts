import { Injectable, NotFoundException } from '@nestjs/common';
import {
  toSubscriptionPlanResponse,
  type SubscriptionPlanResponse,
} from '../../mappers/subscription-plan.mapper';
import { SubscriptionPlanRepository } from '../../repositories/subscription-plan.repository';

@Injectable()
export class RetireSubscriptionPlanCommand {
  constructor(
    private readonly subscriptionPlanRepository: SubscriptionPlanRepository,
  ) {}

  async execute(id: string): Promise<SubscriptionPlanResponse> {
    const existing = await this.subscriptionPlanRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Subscription plan not found');
    }

    const row = await this.subscriptionPlanRepository.retire(id);
    if (!row) {
      throw new NotFoundException('Subscription plan not found');
    }

    return toSubscriptionPlanResponse(row);
  }
}
