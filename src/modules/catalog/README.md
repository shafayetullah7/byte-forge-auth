# Catalog module

Taxonomy (categories, tags, tag groups), plants, and products (later phases).

## Phase 29 status

- Taxonomy repositories live under `repositories/`
- `CatalogQueryService` stub exported for order/cross-module reads
- Admin taxonomy + seller plant APIs still under `src/api/` — import `CatalogModule` for repos until Phases 30–34

## Cross-module reads

Prefer `CatalogQueryService` over repositories. Repo exports are temporary until admin/seller catalog surfaces migrate.
