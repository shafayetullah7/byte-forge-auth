import { Injectable } from '@nestjs/common';
import {
  toSubscriptionPlanResponse,
  type SubscriptionPlanResponse,
} from '../../mappers/subscription-plan.mapper';
import { SubscriptionPlanRepository } from '../../repositories/subscription-plan.repository';
import type { ListSubscriptionPlansQueryDto } from '../../controllers/dto/list-subscription-plans-query.dto';

@Injectable()
export class ListSubscriptionPlansQuery {
  constructor(
    private readonly subscriptionPlanRepository: SubscriptionPlanRepository,
  ) {}

  async execute(
    query: ListSubscriptionPlansQueryDto,
  ): Promise<SubscriptionPlanResponse[]> {
    const rows = await this.subscriptionPlanRepository.findAll({
      search: query.search,
      activeForNewOnly: query.activeForNewOnly,
      includeRetired:
        query.includeRetired === undefined ? true : query.includeRetired,
    });

    return rows.map(toSubscriptionPlanResponse);
  }
}
