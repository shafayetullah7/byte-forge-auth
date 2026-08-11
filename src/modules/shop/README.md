# Shop module

Seller shop lifecycle, verification, storefront, follow, and public discovery.

## Routes (Phases 21–22)

| Controller | Path |
|------------|------|
| `SellerShopProfileController` | `v1/user/seller/shops` — apply, profile, contact, address |

Legacy seller controller still serves verification until Phase 23.

## Public exports (`ShopModule`)

| Export | Kind |
|--------|------|
| `ShopRepository` | Core shop persistence |
| `GetShopStatusQuery` | Seller routing status |
| `GetMyShopQuery` | Localized shop profile read |
| `ApplyAsSellerCommand` | Create shop + translations |
| `UpdateMyShopCommand` | PATCH translations |
| `UpdateMyShopBrandingCommand` | PATCH branding + media |
| `UpsertMyShopInfoCommand` | PUT branding + bilingual info |
| `UpsertMyShopContactCommand` | PUT contact + social |
| `UpdateMyShopAddressCommand` | PATCH address + EN/BN translations |

## Layout

```
controllers/     Seller profile HTTP (Phases 21–22)
application/     Commands, queries, section helper
domain/          Shop entity, status policy
mappers/         API response shapes
repositories/    Shop persistence (shop, contact, address aggregate)
```
