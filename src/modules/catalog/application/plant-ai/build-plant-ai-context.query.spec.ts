import { BuildPlantAiContextQuery } from './build-plant-ai-context.query';
import { CategoryAdminRepository } from '../../repositories/category-admin.repository';
import { TagGroupAdminRepository } from '../../repositories/tag-group-admin.repository';

describe('BuildPlantAiContextQuery', () => {
  const categoryAdminRepository = {
    listActivePublic: jest.fn(),
  };

  const tagGroupAdminRepository = {
    listActiveWithTags: jest.fn(),
  };

  let query: BuildPlantAiContextQuery;

  beforeEach(() => {
    jest.clearAllMocks();
    query = new BuildPlantAiContextQuery(
      categoryAdminRepository as unknown as CategoryAdminRepository,
      tagGroupAdminRepository as unknown as TagGroupAdminRepository,
    );
  });

  it('builds bilingual category and tag options with enum keys', async () => {
    categoryAdminRepository.listActivePublic.mockResolvedValue([
      {
        id: 'cat-1',
        slug: 'indoor',
        translations: [
          { locale: 'en', name: 'Indoor Plants' },
          { locale: 'bn', name: 'ইনডোর গাছ' },
        ],
      },
    ]);

    tagGroupAdminRepository.listActiveWithTags.mockResolvedValue([
      {
        id: 'group-1',
        slug: 'light',
        translations: [{ locale: 'en', name: 'Light' }],
        tags: [
          {
            id: 'tag-1',
            slug: 'low-light',
            translations: [
              { locale: 'en', name: 'Low light' },
              { locale: 'bn', name: 'কম আলো' },
            ],
          },
        ],
      },
    ]);

    const context = await query.execute();

    expect(context.categories).toEqual([
      {
        id: 'cat-1',
        slug: 'indoor',
        nameEn: 'Indoor Plants',
        nameBn: 'ইনডোর গাছ',
      },
    ]);
    expect(context.tags).toEqual([
      {
        id: 'tag-1',
        slug: 'low-light',
        groupSlug: 'light',
        nameEn: 'Low light',
        nameBn: 'কম আলো',
      },
    ]);
    expect(context.enums.lightRequirement).toContain('BRIGHT_INDIRECT');
    expect(context.enums.wateringFrequency).toContain('WEEKLY');
    expect(context.enums.growthStage).toContain('JUVENILE');
    expect(context.enums.plantForm).toContain('CLIMBING');
  });
});
