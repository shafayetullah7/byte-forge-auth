import { Injectable, NotFoundException } from '@nestjs/common';
import { ReviewRepository } from '../../repositories/review.repository';

@Injectable()
export class UpdateReviewReportStatusCommand {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute(
    reportId: string,
    status: 'OPEN' | 'RESOLVED' | 'DISMISSED',
    adminId: string,
  ) {
    const report = await this.reviewRepository.updateReviewReportStatus(
      reportId,
      status,
      adminId,
    );

    if (!report) {
      throw new NotFoundException('Review report not found');
    }

    return report;
  }
}
