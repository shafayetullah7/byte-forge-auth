import { BadRequestException } from '@nestjs/common';
import { BulkImportTagGroupsCommand } from './bulk-import-tag-groups.command';
import { TagGroupRepository } from '../../repositories/tag-group.repository';
import { TagRepository } from '../../repositories/tag.repository';

describe('BulkImportTagGroupsCommand', () => {
  const groupId = 'group-1';

  let db: { transaction: jest.Mock };
  let tagGroupRepository: jest.Mocked<
    Pick<
      TagGroupRepository,
      | 'findBySlug'
      | 'create'
      | 'createTranslations'
      | 'incrementTagCount'
    >
  >;
  let tagRepository: jest.Mocked<
    Pick<TagRepository, 'findBySlugs' | 'createMany' | 'createManyTranslations'>
  >;
  let command: BulkImportTagGroupsCommand;

  beforeEach(() => {
    db = {
      transaction: jest.fn(async (callback) => callback({})),
    };
    tagGroupRepository = {
      findBySlug: jest.fn(),
      create: jest.fn(),
      createTranslations: jest.fn(),
      incrementTagCount: jest.fn(),
    };
    tagRepository = {
      findBySlugs: jest.fn().mockResolvedValue([]),
      createMany: jest.fn(),
      createManyTranslations: jest.fn(),
    };
    command = new BulkImportTagGroupsCommand(
      db as never,
      tagGroupRepository as unknown as TagGroupRepository,
      tagRepository as unknown as TagRepository,
    );
  });

  it('dry-run reports would-create rows without writing', async () => {
    const result = await command.execute({
      groups: [
        {
          slug: 'light-requirement',
          translations: {
            en: { name: 'Light requirement' },
            bn: { name: 'আলোর প্রয়োজনীয়তা' },
          },
          tags: [
            {
              slug: 'low-light',
              translations: {
                en: { name: 'Low light' },
                bn: { name: 'কম আলো' },
              },
            },
          ],
        },
      ],
      options: { dryRun: true, onDuplicate: 'skip' },
    });

    expect(result.dryRun).toBe(true);
    expect(result.success).toBe(true);
    expect(result.summary.groupsCreated).toBe(1);
    expect(result.summary.tagsCreated).toBe(1);
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it('creates a new group and tags in one transaction', async () => {
    tagGroupRepository.findBySlug.mockResolvedValue(undefined);
    tagGroupRepository.create.mockResolvedValue({
      id: groupId,
      slug: 'light-requirement',
    } as never);
    tagRepository.createMany.mockResolvedValue([
      { id: 'tag-1', slug: 'low-light', groupId },
    ] as never);

    const result = await command.execute({
      groups: [
        {
          slug: 'light-requirement',
          translations: {
            en: { name: 'Light requirement' },
            bn: { name: 'আলোর প্রয়োজনীয়তা' },
          },
          tags: [
            {
              slug: 'low-light',
              translations: {
                en: { name: 'Low light' },
                bn: { name: 'কম আলো' },
              },
            },
          ],
        },
      ],
      options: { dryRun: false, onDuplicate: 'skip' },
    });

    expect(result.success).toBe(true);
    expect(tagGroupRepository.create).toHaveBeenCalled();
    expect(tagRepository.createMany).toHaveBeenCalled();
    expect(tagGroupRepository.incrementTagCount).toHaveBeenCalledWith(
      groupId,
      1,
      expect.anything(),
    );
  });

  it('skips existing tag slugs when onDuplicate is skip', async () => {
    tagGroupRepository.findBySlug.mockResolvedValue({
      id: groupId,
      slug: 'light-requirement',
    } as never);
    tagRepository.findBySlugs.mockResolvedValue([
      { id: 'tag-existing', slug: 'low-light', groupId },
    ] as never);

    const result = await command.execute({
      groups: [
        {
          slug: 'light-requirement',
          existing: true,
          tags: [
            {
              slug: 'low-light',
              translations: {
                en: { name: 'Low light' },
                bn: { name: 'কম আলো' },
              },
            },
          ],
        },
      ],
      options: { dryRun: false, onDuplicate: 'skip' },
    });

    expect(result.summary.tagsCreated).toBe(0);
    expect(result.summary.skipped).toBeGreaterThan(0);
    expect(tagRepository.createMany).not.toHaveBeenCalled();
  });

  it('returns errors when onDuplicate is error and group exists', async () => {
    tagGroupRepository.findBySlug.mockResolvedValue({
      id: groupId,
      slug: 'light-requirement',
    } as never);

    const result = await command.execute({
      groups: [
        {
          slug: 'light-requirement',
          translations: {
            en: { name: 'Light requirement' },
            bn: { name: 'আলোর প্রয়োজনীয়তা' },
          },
          tags: [],
        },
      ],
      options: { dryRun: true, onDuplicate: 'error' },
    });

    expect(result.success).toBe(false);
    expect(result.summary.errors).toBe(1);
  });

  it('rejects duplicate tag slugs within the payload', async () => {
    await expect(
      command.execute({
        groups: [
          {
            slug: 'group-a',
            translations: {
              en: { name: 'Group A' },
              bn: { name: 'গ্রুপ এ' },
            },
            tags: [
              {
                slug: 'shared-tag',
                translations: {
                  en: { name: 'Shared' },
                  bn: { name: 'শেয়ার্ড' },
                },
              },
            ],
          },
          {
            slug: 'group-b',
            translations: {
              en: { name: 'Group B' },
              bn: { name: 'গ্রুপ বি' },
            },
            tags: [
              {
                slug: 'shared-tag',
                translations: {
                  en: { name: 'Shared again' },
                  bn: { name: 'আবার শেয়ার্ড' },
                },
              },
            ],
          },
        ],
        options: { dryRun: false, onDuplicate: 'skip' },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
