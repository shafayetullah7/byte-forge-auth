# Shop module

Seller shop lifecycle, verification, storefront, follow, and public discovery.

## Public exports (`ShopModule`)

| Export | Kind |
|--------|------|
| `ShopRepository` | Core shop persistence + related table writes |

## Layout

```
domain/          Shop entity, status policy, verification rules
repositories/    ShopRepository, row ↔ entity mappers
```

## Phase status

| Phase | Scope | Status |
|-------|--------|--------|
| 19 | Domain entity + policy | Done |
| 20 | Core `ShopRepository` moved from `_repositories/business/shop.repository/` | Done |
| 21–28 | Seller/admin/public HTTP cutover | Pending |

Legacy HTTP still served from `src/api/**/shop*`; all callers now import `ShopRepository` from this module.

## Entity mapping

`shop.repository.mapper.ts` maps `TShop` ↔ `Shop` entity and `TShopTranslation` → `ShopTranslationRecord`.

Entity helpers on repository: `createShopEntity`, `getShopEntityById`, `getShopEntityByOwnerId`, `updateShopEntity`.
