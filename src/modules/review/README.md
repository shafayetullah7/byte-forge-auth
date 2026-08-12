# Review module

Product reviews and seller reports. All review HTTP surfaces live here.

## HTTP

| Audience | Routes | Controller |
|----------|--------|------------|
| Buyer | `v1/user/buyer/reviews` | `BuyerReviewsController` |
| Seller | `v1/user/seller/products/:productId/reviews`, `v1/user/seller/reviews/:reviewId/report` | `SellerReviewsController` |
| Public shop | `v1/shops/:slug/reviews` | `PublicShopReviewsController` |
| Public | `v1/reviews/products/:productId`, `v1/reviews/plants/:slug`, `v1/reviews/featured` | `PublicReviewsController` |
| Admin | `v1/admin/reviews` | `AdminReviewsController` |

## Cross-module access

| Consumer | API |
|----------|-----|
| Order | `ReviewQueryService.getReviewStatusesForOrderItems` |

## Module graph

`ReviewModule` → `ShopModule` (one-way). Exports `ReviewQueryService` only.

## Debt

- Repository joins `orderItems`, `products` for eligibility and list enrichment — refactor to order/catalog query services later.
