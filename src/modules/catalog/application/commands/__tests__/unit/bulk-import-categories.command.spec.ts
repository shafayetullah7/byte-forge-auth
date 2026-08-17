import { BadRequestException } from '@nestjs/common';
import { BulkImportCategoriesCommand } from '../../bulk-import-categories.command';
import { CategoryAdminRepository } from '../../../../repositories/category-admin.repository';
import { CategoryHierarchyRepository } from '../../../../repositories/category-hierarchy.repository';
import { CategoryRepository } from '../../../../repositories/category.repository';

describe('BulkImportCategoriesCommand', () => {
  let db: { transaction: jest.Mock };
  let categoryRepository: jest.Mocked<
    Pick<
      CategoryRepository,
      'findBySlug' | 'create' | 'update' | 'incrementChildrenCount'
    >
  >;
  let hierarchyRepository: jest.Mocked<
    Pick<CategoryHierarchyRepository, 'insertNode'>
  >;
  let categoryAdminRepository: jest.Mocked<
    Pick<
      CategoryAdminRepository,
      'getMaxAncestorDepth' | 'insertTranslations' | 'upsertTranslations'
    >
  >;
  let command: BulkImportCategoriesCommand;

  beforeEach(() => {
    db = {
      transaction: jest.fn(async (callback) => callback({})),
    };
    categoryRepository = {
      findBySlug: jest.fn().mockResolvedValue(undefined),
      create: jest.fn(),
      update: jest.fn(),
      incrementChildrenCount: jest.fn(),
    };
    hierarchyRepository = {
      insertNode: jest.fn(),
    };
    categoryAdminRepository = {
      getMaxAncestorDepth: jest.fn().mockResolvedValue(0),
      insertTranslations: jest.fn(),
      upsertTranslations: jest.fn(),
    };
    command = new BulkImportCategoriesCommand(
      db as never,
      categoryRepository as unknown as CategoryRepository,
      hierarchyRepository as unknown as CategoryHierarchyRepository,
      categoryAdminRepository as unknown as CategoryAdminRepository,
    );
  });

  it('dry-run reports would-create rows without writing', async () => {
    const result = await command.execute({
      items: [
        {
          slug: 'indoor-plants',
          translations: {
            en: { name: 'Indoor Plants' },
            bn: { name: 'ইনডোর উদ্ভিদ' },
          },
          children: [
            {
              slug: 'foliage-plants',
              translations: {
                en: { name: 'Foliage Plants' },
                bn: { name: 'পাতার উদ্ভিদ' },
              },
            },
          ],
        },
      ],
      options: { dryRun: true, onDuplicate: 'skip' },
    });

    expect(result.dryRun).toBe(true);
    expect(result.success).toBe(true);
    expect(result.summary.categoriesCreated).toBe(2);
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it('creates nested categories in one transaction', async () => {
    categoryRepository.create
      .mockResolvedValueOnce({ id: 'cat-root', slug: 'indoor-plants' } as never)
      .mockResolvedValueOnce({ id: 'cat-child', slug: 'foliage-plants' } as never);

    const result = await command.execute({
      items: [
        {
          slug: 'indoor-plants',
          translations: { en: { name: 'Indoor Plants' } },
          children: [
            {
              slug: 'foliage-plants',
              translations: { en: { name: 'Foliage Plants' } },
            },
          ],
        },
      ],
      options: { dryRun: false, onDuplicate: 'skip' },
    });

    expect(result.success).toBe(true);
    expect(result.summary.categoriesCreated).toBe(2);
    expect(categoryRepository.create).toHaveBeenCalledTimes(2);
    expect(hierarchyRepository.insertNode).toHaveBeenCalledTimes(2);
  });

  it('skips existing category slugs when onDuplicate is skip', async () => {
    categoryRepository.findBySlug.mockImplementation(async (slug: string) => {
      if (slug === 'indoor-plants') {
        return { id: 'existing-root', slug } as never;
      }
      return undefined;
    });
    categoryAdminRepository.getMaxAncestorDepth.mockResolvedValue(0);
    categoryRepository.create.mockResolvedValue({
      id: 'cat-child',
      slug: 'foliage-plants',
    } as never);

    const result = await command.execute({
      items: [
        {
          slug: 'indoor-plants',
          translations: { en: { name: 'Indoor Plants' } },
          children: [
            {
              slug: 'foliage-plants',
              translations: { en: { name: 'Foliage Plants' } },
            },
          ],
        },
      ],
      options: { dryRun: false, onDuplicate: 'skip' },
    });

    expect(result.summary.skipped).toBe(1);
    expect(result.summary.categoriesCreated).toBe(1);
    expect(categoryRepository.create).toHaveBeenCalledTimes(1);
  });

  it('returns errors when onDuplicate is error and category exists', async () => {
    categoryRepository.findBySlug.mockResolvedValue({
      id: 'existing-root',
      slug: 'indoor-plants',
    } as never);

    const result = await command.execute({
      items: [
        {
          slug: 'indoor-plants',
          translations: { en: { name: 'Indoor Plants' } },
        },
      ],
      options: { dryRun: true, onDuplicate: 'error' },
    });

    expect(result.success).toBe(false);
    expect(result.summary.errors).toBe(1);
  });

  it('rejects duplicate slugs within the payload', async () => {
    await expect(
      command.execute({
        items: [
          {
            slug: 'duplicate-slug',
            translations: { en: { name: 'One' } },
          },
          {
            slug: 'duplicate-slug',
            translations: { en: { name: 'Two' } },
          },
        ],
        options: { dryRun: false, onDuplicate: 'skip' },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates existing categories when onDuplicate is upsert', async () => {
    categoryRepository.findBySlug.mockResolvedValue({
      id: 'existing-root',
      slug: 'indoor-plants',
    } as never);

    const result = await command.execute({
      items: [
        {
          slug: 'indoor-plants',
          isActive: false,
          translations: {
            en: { name: 'Indoor Plants Updated' },
            bn: { name: 'আপডেটেড' },
          },
        },
      ],
      options: { dryRun: false, onDuplicate: 'upsert' },
    });

    expect(result.success).toBe(true);
    expect(result.summary.updated).toBe(1);
    expect(categoryRepository.create).not.toHaveBeenCalled();
    expect(categoryRepository.update).toHaveBeenCalled();
    expect(categoryAdminRepository.upsertTranslations).toHaveBeenCalled();
  });

  it('upserts translations without changing isActive when omitted', async () => {
    categoryRepository.findBySlug.mockResolvedValue({
      id: 'existing-root',
      slug: 'indoor-plants',
    } as never);

    const result = await command.execute({
      items: [
        {
          slug: 'indoor-plants',
          translations: { en: { name: 'Indoor Plants Updated' } },
        },
      ],
      options: { dryRun: false, onDuplicate: 'upsert' },
    });

    expect(result.success).toBe(true);
    expect(result.summary.updated).toBe(1);
    expect(categoryRepository.update).not.toHaveBeenCalled();
    expect(categoryAdminRepository.upsertTranslations).toHaveBeenCalled();
  });

  it('reports dryRun false when every slug is skipped', async () => {
    categoryRepository.findBySlug.mockResolvedValue({
      id: 'existing-root',
      slug: 'indoor-plants',
    } as never);
    categoryAdminRepository.getMaxAncestorDepth.mockResolvedValue(0);

    const result = await command.execute({
      items: [
        {
          slug: 'indoor-plants',
          translations: { en: { name: 'Indoor Plants' } },
        },
      ],
      options: { dryRun: false, onDuplicate: 'skip' },
    });

    expect(result.dryRun).toBe(false);
    expect(result.summary.skipped).toBe(1);
    expect(db.transaction).not.toHaveBeenCalled();
  });
});
