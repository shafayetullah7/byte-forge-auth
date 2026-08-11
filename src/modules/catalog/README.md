# Catalog module

Taxonomy (categories, tags, tag groups), plants, and products (later phases).

## Routes

| Controller | Path |
|------------|------|
| `AdminCategoriesController` | `admin/categories` |
| `AdminTagsController` | `admin/tags` |
| `AdminTagGroupsController` | `admin/tag-groups` |
| `PublicCategoriesController` | `v1/tree-categories` |
| `PublicTagsController` | `v1/tags` |

## Cross-module reads

Prefer `CatalogQueryService` over repositories. Category/tag repo exports remain temporary until seller plants migrate.

## Notes

- Admin/public taxonomy SQL lives in `*AdminRepository` classes — application commands/queries must not use `db.client`.
