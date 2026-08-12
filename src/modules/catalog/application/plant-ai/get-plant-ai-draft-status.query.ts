import { Injectable } from '@nestjs/common';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';

export type PlantAiDraftStatus = {
  enabled: boolean;
};

@Injectable()
export class GetPlantAiDraftStatusQuery {
  constructor(private readonly appConfig: AppConfigService) {}

  execute(): PlantAiDraftStatus {
    return { enabled: this.appConfig.isPlantAiEnabled };
  }
}
