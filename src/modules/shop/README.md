# Shop module

Seller shop lifecycle, verification, storefront (later), follow (later), and public discovery (later).

## Routes

| Controller | Path |
|------------|------|
| `SellerShopProfileController` | `v1/user/seller/shops` — apply, profile, contact, address, verification |
| `AdminShopsController` | `v1/admin/shops` — list, stats, approve/reject, suspend/deactivate/reactivate |

## Public exports (`ShopModule`)

| Export | Kind |
|--------|------|
| `ShopRepository` | Core shop persistence |
| `ShopVerificationRepository` | Verification records |
| `ShopVerificationHistoryRepository` | Verification audit trail |
| Seller profile queries/commands | Apply, profile, contact, address |
| Seller verification queries/commands | Status, documents, submit, history |

## Layout

```
controllers/     Seller + admin HTTP
application/     Commands, queries, section helper
domain/          Shop entity, status policy
mappers/         API response shapes
repositories/    Shop + verification persistence
```
