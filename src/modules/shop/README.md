# Shop module

Seller shop lifecycle, verification, storefront, shipping rates, follow (later), and public discovery (later).

## Routes

| Controller | Path |
|------------|------|
| `SellerShopProfileController` | `v1/user/seller/shops` |
| `SellerStorefrontController` | `v1/user/seller/storefront` |
| `SellerShippingRatesController` | `v1/user/seller/shipping-rates` |
| `AdminShopsController` | `v1/admin/shops` |

## Notes

- Do **not** import `VerifiedUserAuthGuardModule` into `ShopModule` (circular: guard module imports `ShopModule`). The guard is `@Global` via `AppModule`.
- `ShopStorefrontRepository` is exported for public shop reads until Phase 27.
- Order place/price-breakdown still reads rates via `OrderRepository`; seller CRUD uses `ShopShippingRatesRepository`.
