import { AppConfigService } from '@/libs/modules/app-config/app-config.service';
import { GetPlantAiDraftStatusQuery } from '../../get-plant-ai-draft-status.query';

describe('GetPlantAiDraftStatusQuery', () => {
  it('returns enabled when config flag and key are set', () => {
    const query = new GetPlantAiDraftStatusQuery({
      isPlantAiEnabled: true,
    } as AppConfigService);

    expect(query.execute()).toEqual({ enabled: true });
  });

  it('returns disabled when feature is off', () => {
    const query = new GetPlantAiDraftStatusQuery({
      isPlantAiEnabled: false,
    } as AppConfigService);

    expect(query.execute()).toEqual({ enabled: false });
  });
});
