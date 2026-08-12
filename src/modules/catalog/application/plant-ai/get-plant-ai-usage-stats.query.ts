import { Injectable } from '@nestjs/common';
import {
  PlantAiUsageRepository,
  type PlantAiDailyUsageStats,
} from '../../repositories/plant-ai-usage.repository';

@Injectable()
export class GetPlantAiUsageStatsQuery {
  constructor(private readonly usageRepository: PlantAiUsageRepository) {}

  async execute(usageDate?: string): Promise<PlantAiDailyUsageStats> {
    return this.usageRepository.getDailyAggregateStats(usageDate);
  }
}
