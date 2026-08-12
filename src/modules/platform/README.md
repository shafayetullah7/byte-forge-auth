# Platform module

Cross-cutting platform endpoints: health check, admin i18n languages, and seller analytics overview.

## HTTP

| Routes | Controller |
|--------|------------|
| `health` (no `/api` prefix) | `HealthController` |
| `v1/admin/languages` | `AdminLanguagesController` |
| `v1/user/seller/analytics/overview` | `SellerAnalyticsController` |

## Seller analytics placement

Seller analytics lives in **Platform** (not Shop) because it aggregates read-only metrics across order, shop follow, and content modules via `SellerAnalyticsRepository`, `ShopFollowRepository`, and `ContentQueryService`. Shop remains the owner of shop identity and verification; platform owns cross-domain reporting facades.

## Cross-module access

| Dependency | Used for |
|------------|----------|
| `ShopModule` | `ShopFollowRepository` |
| `ContentModule` | `ContentQueryService` (campaign/article counts) |
| `DrizzleModule` | Order metrics + product enrichment for top sellers |
