# Shop module

Seller shop lifecycle, verification, storefront, shipping rates, buyer follow, and public discovery (later).

## Routes

| Controller | Path |
|------------|------|
| `SellerShopProfileController` | `v1/user/seller/shops` |
| `SellerStorefrontController` | `v1/user/seller/storefront` |
| `SellerShippingRatesController` | `v1/user/seller/shipping-rates` |
| `BuyerShopFollowController` | `v1/user/buyer/shops` |
| `AdminShopsController` | `v1/admin/shops` |

## Notes

- Do **not** import `VerifiedUserAuthGuardModule` into `ShopModule` (circular: guard module imports `ShopModule`). The guard is `@Global` via `AppModule`.
- `ShopStorefrontRepository` / `ShopFollowRepository` are exported for public shop reads and seller analytics until those migrate.
- Order place/price-breakdown still reads rates via `OrderRepository`; seller CRUD uses `ShopShippingRatesRepository`.
