# Catalog module

Taxonomy (categories, tags, tag groups), plants, and products.

## Routes

| Controller | Path |
|------------|------|
| `AdminCategoriesController` | `admin/categories` |
| `AdminTagsController` | `admin/tags` |
| `AdminTagGroupsController` | `admin/tag-groups` |
| `AdminProductsController` | `admin/products` |
| `PublicCategoriesController` | `v1/tree-categories` |
| `PublicTagsController` | `v1/tags` |
| `PublicPlantsController` | `v1/plants` |
| `SellerProductsController` | `v1/user/seller/products` |
| `SellerPlantsController` | `v1/user/seller/plants` |

## Cross-module reads

Prefer `CatalogQueryService` over repositories (`getProductSummaries` for order/admin list enrichment).

## Notes

- Admin/public taxonomy SQL lives in `*AdminRepository` classes — application commands/queries should not use `db.client` directly where avoidable.
- Plant write commands still contain persistence SQL (hardening debt); reads use query classes.
