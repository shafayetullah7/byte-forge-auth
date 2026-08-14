import { ExportCategoriesForImportQuery } from './export-categories-for-import.query';
import { CategoryAdminRepository } from '../../repositories/category-admin.repository';

describe('ExportCategoriesForImportQuery', () => {
  let categoryAdminRepository: jest.Mocked<
    Pick<
      CategoryAdminRepository,
      'listForImportExport' | 'listTranslationsByCategoryIds'
    >
  >;
  let query: ExportCategoriesForImportQuery;

  beforeEach(() => {
    categoryAdminRepository = {
      listForImportExport: jest.fn(),
      listTranslationsByCategoryIds: jest.fn(),
    };
    query = new ExportCategoriesForImportQuery(
      categoryAdminRepository as unknown as CategoryAdminRepository,
    );
  });

  it('builds nested import-compatible JSON with translations', async () => {
    categoryAdminRepository.listForImportExport.mockResolvedValue([
      {
        id: 'root-id',
        slug: 'indoor-plants',
        isActive: true,
        commissionRate: null,
        parentId: null,
      },
      {
        id: 'child-id',
        slug: 'foliage-plants',
        isActive: true,
        commissionRate: '12.50',
        parentId: 'root-id',
      },
    ] as never);
    categoryAdminRepository.listTranslationsByCategoryIds.mockResolvedValue([
      {
        categoryId: 'root-id',
        locale: 'en',
        name: 'Indoor Plants',
        description: null,
      },
      {
        categoryId: 'root-id',
        locale: 'bn',
        name: 'ইনডোর উদ্ভিদ',
        description: null,
      },
      {
        categoryId: 'child-id',
        locale: 'en',
        name: 'Foliage Plants',
        description: null,
      },
    ] as never);

    const result = await query.execute();

    expect(result.items).toHaveLength(1);
    expect(result.items[0].slug).toBe('indoor-plants');
    expect(result.items[0].children).toHaveLength(1);
    expect(result.items[0].children?.[0].slug).toBe('foliage-plants');
    expect(result.items[0].children?.[0].commissionRate).toBe(12.5);
    const rootTranslations = result.items[0].translations;
    expect(Array.isArray(rootTranslations)).toBe(false);
    if (!Array.isArray(rootTranslations)) {
      expect(rootTranslations.en.name).toBe('Indoor Plants');
    }
  });
});
