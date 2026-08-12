# Cart module

Buyer cart and wishlist HTTP, persistence, and cross-module cart API.

## Routes (unchanged)

| Controller | Path |
|------------|------|
| `CartController` | `user/buyer/cart` |
| `WishlistController` | `user/buyer/wishlist` |

## Public exports (`CartModule`)

| Export | Kind |
|--------|------|
| `CartQueryService` / `CartCommandService` | Low-level cross-module API (Order checkout) |
| `GetCartQuery`, `GetCartCountQuery`, `ValidateCartQuery` | Read queries |
| `AddToCartCommand`, … `MergeGuestCartCommand` | Mutation commands |
| `ListWishlistQuery`, `AddWishlistItemCommand`, `RemoveWishlistItemCommand` | Wishlist |
| `CartFacade` | HTTP orchestration (internal to controllers) |

## Layout

```
controllers/     Cart + wishlist HTTP
application/     Commands, queries, CartFacade, listeners
mappers/         Cart + wishlist response mapping
repositories/    Cart + wishlist persistence
```

## Guards

Do **not** import `*GuardModule` here. All guards are `@Global()` via `AppModule`; use `@UseGuards(...)` on controllers only.

## Cross-module

Order checkout uses `OrderCartIntegration` → `CartQueryService` / `CartCommandService.removeOrderedItems({ tx })`.
