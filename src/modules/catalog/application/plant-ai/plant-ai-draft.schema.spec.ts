import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  parsePlantAiDraftRequest,
  parsePlantAiDraftResponse,
  plantAiDraftRequestSchema,
} from './plant-ai-draft.schema';

const monsteraFixture = JSON.parse(
  readFileSync(
    join(__dirname, '__fixtures__', 'plant-ai-draft.monstera.json'),
    'utf8',
  ),
);

const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';
const TAG_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_TAG_ID = '33333333-3333-4333-8333-333333333333';

const allowlists = {
  categoryIds: new Set([CATEGORY_ID]),
  tagIds: new Set([TAG_ID, OTHER_TAG_ID]),
};

describe('plantAiDraftRequestSchema', () => {
  it('accepts scientific name only', () => {
    const result = parsePlantAiDraftRequest({
      scientificName: 'Monstera deliciosa',
    });
    expect(result.scientificName).toBe('Monstera deliciosa');
  });

  it('rejects empty request', () => {
    expect(() => plantAiDraftRequestSchema.parse({})).toThrow();
  });

  it('rejects invalid thumbnail UUID', () => {
    expect(() =>
      plantAiDraftRequestSchema.parse({ thumbnailMediaId: 'not-a-uuid' }),
    ).toThrow();
  });
});

describe('parsePlantAiDraftResponse', () => {
  it('accepts valid fixture with allowlisted ids', () => {
    const result = parsePlantAiDraftResponse(monsteraFixture, allowlists);
    expect(result.translations.en.name).toBe('Monstera');
    expect(result.translations.bn.name).toBe('মনস্টেরা');
    expect(result.plantDetails.categoryId).toBe(CATEGORY_ID);
    expect(result.plantDetails.tagIds).toEqual([TAG_ID]);
  });

  it('rejects categoryId not in allowlist', () => {
    expect(() =>
      parsePlantAiDraftResponse(monsteraFixture, {
        categoryIds: new Set(['99999999-9999-4999-8999-999999999999']),
        tagIds: allowlists.tagIds,
      }),
    ).toThrow(/categoryId/);
  });

  it('rejects tagId not in allowlist', () => {
    const invalid = {
      ...monsteraFixture,
      plantDetails: {
        ...monsteraFixture.plantDetails,
        tagIds: ['99999999-9999-4999-8999-999999999999'],
      },
    };

    expect(() => parsePlantAiDraftResponse(invalid, allowlists)).toThrow(/tagId/);
  });

  it('rejects invalid care enum', () => {
    const invalid = {
      ...monsteraFixture,
      plantDetails: {
        ...monsteraFixture.plantDetails,
        lightRequirement: 'SUPER_BRIGHT',
      },
    };

    expect(() => parsePlantAiDraftResponse(invalid, allowlists)).toThrow();
  });

  it('rejects BN name shorter than 3 characters', () => {
    const invalid = {
      ...monsteraFixture,
      translations: {
        ...monsteraFixture.translations,
        bn: { ...monsteraFixture.translations.bn, name: 'অ' },
      },
    };

    expect(() => parsePlantAiDraftResponse(invalid, allowlists)).toThrow();
  });
});
