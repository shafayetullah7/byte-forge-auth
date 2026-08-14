export type BulkImportEntity = 'tag_group' | 'tag';

export type BulkImportRowStatus = 'created' | 'skipped' | 'error';

export type BulkImportTagGroupsRowResult = {
  ref: string;
  entity: BulkImportEntity;
  slug: string;
  status: BulkImportRowStatus;
  id?: string;
  message?: string;
};

export type BulkImportTagGroupsSummary = {
  created: number;
  skipped: number;
  errors: number;
  groupsCreated: number;
  tagsCreated: number;
};

export type BulkImportTagGroupsResult = {
  dryRun: boolean;
  success: boolean;
  summary: BulkImportTagGroupsSummary;
  results: BulkImportTagGroupsRowResult[];
};

export type NormalizedTagImport = {
  slug: string;
  isActive: boolean;
  translations: Array<{
    locale: 'en' | 'bn';
    name: string;
    description?: string | null;
  }>;
};

export type NormalizedGroupImport = {
  slug: string;
  isActive: boolean;
  existing: boolean;
  translations?: NormalizedTagImport['translations'];
  tags: NormalizedTagImport[];
};
