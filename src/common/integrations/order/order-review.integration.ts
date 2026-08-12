import { Injectable } from '@nestjs/common';
import { ReviewQueryService } from '@/modules/review/application/queries';

@Injectable()
export class OrderReviewIntegration {
  constructor(private readonly reviewQueryService: ReviewQueryService) {}

  getReviewStatusesForOrderItems(orderItemIds: string[]) {
    return this.reviewQueryService.getReviewStatusesForOrderItems(orderItemIds);
  }
}
