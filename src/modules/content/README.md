# Content module

Shop articles and campaigns (seller CRUD, admin moderation, public shop lists).

## HTTP

| Audience | Routes | Controller |
|----------|--------|------------|
| Seller | `v1/user/seller/articles`, `v1/user/seller/campaigns` | `SellerArticlesController`, `SellerCampaignsController` |
| Admin | `v1/admin/articles`, `v1/admin/campaigns` | `AdminArticlesController`, `AdminCampaignsController` |
| Public shop | `v1/shops/:slug/articles`, `v1/shops/:slug/campaigns` | `PublicShopArticlesController`, `PublicShopCampaignsController` |

## Cross-module access

| Consumer | API |
|----------|-----|
| Seller analytics | `ContentQueryService.countApprovedArticlesByShopId`, `countApprovedCampaignsByShopId` |

## Module graph

`ContentModule` → `ShopModule` (one-way). Exports `ContentQueryService` only.
