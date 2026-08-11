# Catalog module

Taxonomy (categories, tags, tag groups), plants, and products (later phases).

## Routes

| Controller | Path |
|------------|------|
| `AdminCategoriesController` | `admin/categories` |

## Cross-module reads

Prefer `CatalogQueryService` over repositories. Tag/tag-group repo exports remain temporary until Phases 31–34.

## Notes

- Admin category SQL lives in `CategoryAdminRepository` — application commands/queries must not use `db.client`.
