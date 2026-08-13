import { Injectable, NotFoundException } from '@nestjs/common';
import {
  toSubscriptionPlanResponse,
  type SubscriptionPlanResponse,
} from '../../mappers/subscription-plan.mapper';
import { SubscriptionPlanRepository } from '../../repositories/subscription-plan.repository';

@Injectable()
export class GetSubscriptionPlanQuery {
  constructor(
    private readonly subscriptionPlanRepository: SubscriptionPlanRepository,
  ) {}

  async execute(id: string): Promise<SubscriptionPlanResponse> {
    const row = await this.subscriptionPlanRepository.findById(id);
    if (!row) {
      throw new NotFoundException('Subscription plan not found');
    }

    return toSubscriptionPlanResponse(row);
  }
}
