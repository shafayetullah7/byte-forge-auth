type ProductListRow = {
  id: string;
  slug: string;
  status: string;
  productType: string;
  createdAt: Date;
  updatedAt: Date;
  thumbnailUrl: string | null;
  name: string | null;
  price: string | null;
  inventoryCount: number | null;
  shopId: string;
  shopSlug: string;
  shopName: string | null;
  shopStatus: string;
};

type ProductDetailRow = ProductListRow & {
  shortDescription: string | null;
  description: string | null;
  translations: Array<{
    locale: string;
    name: string;
    shortDescription: string | null;
    description: string | null;
  }>;
  sku: string | null;
};

export function mapAdminProductSummary(row: ProductListRow) {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    productType: row.productType,
    name: row.name ?? row.slug,
    thumbnailUrl: row.thumbnailUrl,
    price: row.price,
    inventoryCount: row.inventoryCount ?? 0,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    shop: {
      id: row.shopId,
      slug: row.shopSlug,
      name: row.shopName ?? row.shopSlug,
      status: row.shopStatus,
    },
  };
}

export function mapAdminProductDetail(row: ProductDetailRow) {
  const enTranslation = row.translations.find((t) => t.locale === 'en');
  const bnTranslation = row.translations.find((t) => t.locale === 'bn');

  return {
    ...mapAdminProductSummary(row),
    sku: row.sku,
    shortDescription: row.shortDescription,
    description: row.description,
    translations: {
      en: {
        name: enTranslation?.name ?? row.name ?? row.slug,
        shortDescription: enTranslation?.shortDescription ?? null,
        description: enTranslation?.description ?? null,
      },
      bn: {
        name: bnTranslation?.name ?? null,
        shortDescription: bnTranslation?.shortDescription ?? null,
        description: bnTranslation?.description ?? null,
      },
    },
  };
}
