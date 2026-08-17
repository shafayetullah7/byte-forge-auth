import { assignFlatDepths, flattenCategoryImportNodes } from '../../bulk-import-categories.util';

describe('bulk-import-categories.util', () => {
  it('flattens nested category trees', () => {
    const flat = flattenCategoryImportNodes([
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
    ]);

    expect(flat).toHaveLength(2);
    expect(flat[0]?.slug).toBe('indoor-plants');
    expect(flat[1]?.parentSlug).toBe('indoor-plants');
  });

  it('assigns depths for flat parentSlug lists', () => {
    const withDepth = assignFlatDepths([
      {
        ref: 'items[0]',
        slug: 'root',
        parentSlug: null,
        depth: 0,
        isActive: true,
        translations: [{ locale: 'en', name: 'Root' }],
      },
      {
        ref: 'items[1]',
        slug: 'child',
        parentSlug: 'root',
        depth: 0,
        isActive: true,
        translations: [{ locale: 'en', name: 'Child' }],
      },
    ]);

    expect(withDepth[1]?.depth).toBe(1);
  });
});
