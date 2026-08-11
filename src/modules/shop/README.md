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

## Notes

- Do **not** import `VerifiedUserAuthGuardModule` into `ShopModule` (circular: guard module imports `ShopModule`). The guard is `@Global` via `AppModule`.
- Public shop queries batch-fetch product/order/review metrics by shop ID on list.
- Campaign/article repos remain legacy imports until those domains migrate.
- Order place/price-breakdown still reads rates via `OrderRepository`.
