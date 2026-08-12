# Review module

Product reviews and seller reports.

## HTTP (modular)

| Audience | Routes | Controller |
|----------|--------|------------|
| Buyer | `v1/user/buyer/reviews` | `BuyerReviewsController` |
| Seller | `v1/user/seller/products/:productId/reviews`, `v1/user/seller/reviews/:reviewId/report` | `SellerReviewsController` |
| Public shop | `v1/shops/:slug/reviews` | `PublicShopReviewsController` |

## Still legacy (Phase 40)

- `src/api/public/reviews/`
- `src/api/admin/reviews/`

## Cross-module access

| Consumer | API |
|----------|-----|
| Order | `ReviewQueryService.getReviewStatusesForOrderItems` |

## Module graph

`ReviewModule` → `ShopModule` (one-way). Shop does not import Review.

## Debt

- Repository joins `orderItems`, `products` for eligibility and list enrichment — refactor to order/catalog query services later.
- `ReviewRepository` exported temporarily for legacy public/admin API until Phase 40.
