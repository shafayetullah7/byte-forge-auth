# Shop module

Seller shop lifecycle, verification, storefront, shipping rates, buyer follow, and public discovery.

## Routes

| Controller | Path |
|------------|------|
| `PublicShopController` | `v1/shops` |
| `SellerShopProfileController` | `v1/user/seller/shops` |
| `SellerStorefrontController` | `v1/user/seller/storefront` |
| `SellerShippingRatesController` | `v1/user/seller/shipping-rates` |
| `BuyerShopFollowController` | `v1/user/buyer/shops` |
| `AdminShopsController` | `v1/admin/shops` |

## Cross-module reads

Use `ShopQueryService` (exported) from catalog, guards, notifications, and order — not `ShopRepository`.

## Notes

- Do **not** import `*GuardModule` into `ShopModule`. Guards are `@Global()` via `AppModule`.
- Legacy fragment repos (`shop.address`, `shop.contact`, `shop.business`, `shop.manager`) removed — consolidated in `ShopRepository`.
- Campaign/article repos remain legacy until those domains migrate.
