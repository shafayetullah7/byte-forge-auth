// Core tables
export * from './products.schema';
export * from './product-translations.schema';
export * from './product-tags.schema';
export * from './product-variants.schema';
export * from './product-variant-translations.schema';
export * from './product-seo.schema';

// Type-specific detail tables
export * from './plant-details.schema';
export * from './plant-details-translations.schema';
export * from './plant-details-tags.schema';
export * from './plant-care-instructions.schema';
export * from './plant-care-translations.schema';
export * from './pot-details.schema';
export * from './seed-details.schema';
export * from './fertilizer-details.schema';

// Type-specific variant attribute tables
export * from './plant-variant-attributes.schema';
export * from './pot-variant-attributes.schema';
export * from './seed-variant-attributes.schema';
export * from './fertilizer-variant-attributes.schema';

// Media
export * from './product-media.schema';

// Plant AI ops
export * from './plant-ai-usage.schema';

// Relations are exported from individual schema files
