# Shop module

Seller shop lifecycle, verification, storefront, follow, and public discovery.

## Routes (Phase 21)

| Controller | Path |
|------------|------|
| `SellerShopProfileController` | `v1/user/seller/shops` — profile GET/PATCH/PUT |

Legacy seller controller still serves apply, contact, address, verification until Phases 22–23.

## Public exports (`ShopModule`)

| Export | Kind |
|--------|------|
| `ShopRepository` | Core shop persistence |
| `GetShopStatusQuery` | Seller routing status |
| `GetMyShopQuery` | Localized shop profile read |
| `UpdateMyShopCommand` | PATCH translations |
| `UpdateMyShopBrandingCommand` | PATCH branding + media |
| `UpsertMyShopInfoCommand` | PUT branding + bilingual info |

## Layout

```
controllers/     Seller profile HTTP (Phase 21+)
application/     Commands and queries
domain/          Shop entity, status policy
mappers/         API response shapes
repositories/    Shop persistence
```
