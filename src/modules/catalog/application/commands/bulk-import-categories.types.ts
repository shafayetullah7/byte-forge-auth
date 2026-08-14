export type BulkImportCategoriesRowResult = {
  ref: string;
  entity: 'category';
  slug: string;
  status: 'created' | 'skipped' | 'error';
  id?: string;
  message?: string;
};

export type BulkImportCategoriesSummary = {
  created: number;
  skipped: number;
  errors: number;
  categoriesCreated: number;
};

export type BulkImportCategoriesResult = {
  dryRun: boolean;
  success: boolean;
  summary: BulkImportCategoriesSummary;
  results: BulkImportCategoriesRowResult[];
};

export type NormalizedCategoryImport = {
  ref: string;
  slug: string;
  parentSlug: string | null;
  depth: number;
  isActive: boolean;
  commissionRate?: number;
  translations: Array<{
    locale: string;
    name: string;
    description?: string | null;
  }>;
};
