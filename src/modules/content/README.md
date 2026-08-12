# Content module

Shop articles (seller CRUD, admin moderation, public shop lists). Campaigns migrate in Phase 42.

## HTTP

| Audience | Routes | Controller |
|----------|--------|------------|
| Seller | `v1/user/seller/articles` | `SellerArticlesController` |
| Admin | `v1/admin/articles` | `AdminArticlesController` |
| Public shop | `v1/shops/:slug/articles` | `PublicShopArticlesController` |

## Cross-module access

| Consumer | API |
|----------|-----|
| Seller analytics | `ContentQueryService.countApprovedByShopId` |

## Module graph

`ContentModule` → `ShopModule` (one-way). Exports `ContentQueryService` only.
