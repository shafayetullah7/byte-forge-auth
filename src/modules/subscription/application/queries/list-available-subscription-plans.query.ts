import { Injectable } from '@nestjs/common';
import {
  toSubscriptionPlanResponse,
  type SubscriptionPlanResponse,
} from '../../mappers/subscription-plan.mapper';
import { SubscriptionPlanRepository } from '../../repositories/subscription-plan.repository';

/** Plans sellers can purchase (excludes retired / inactive-for-new). */
@Injectable()
export class ListAvailableSubscriptionPlansQuery {
  constructor(
    private readonly subscriptionPlanRepository: SubscriptionPlanRepository,
  ) {}

  async execute(): Promise<SubscriptionPlanResponse[]> {
    const rows = await this.subscriptionPlanRepository.findAll({
      activeForNewOnly: true,
    });

    return rows.map(toSubscriptionPlanResponse);
  }
}
