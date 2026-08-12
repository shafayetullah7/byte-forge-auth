# Refactor baseline (Phase 0)

> Recorded: **2026-08-11**  
> Purpose: Verified starting point before modular monolith migration.  
> Plan: [refactor-phases.md](./refactor-phases.md) Phase 0

## Phase 0 deliverables

| Item | Status |
|------|--------|
| `src/modules/` directory + README | Done |
| Path alias `@/modules/*` in `tsconfig.json` | Done |
| Jest e2e `moduleNameMapper` for `@/*` | Done (was missing; blocked e2e collection) |
| No production code moves | Confirmed |

## Verification commands

Run from `byte-forge-auth/`:

```bash
npx tsc --noEmit --incremental false
pnpm lint
pnpm test:e2e
```

### Results (2026-08-11)

| Command | Exit code | Notes |
|---------|-----------|-------|
| `npx tsc --noEmit --incremental false` | **0** | Pass |
| `pnpm lint` | **0** | Pass |
| `pnpm test:e2e` | **1** (pre-fix) | Failed: Jest could not resolve `@/_db/drizzle/enum` — `tests/jest-e2e.json` had no `moduleNameMapper`. Fixed in Phase 0. **Re-run locally** with DB/env available to confirm green. |

### E2e re-run (local)

E2e imports full `AppModule` (PostgreSQL required). Use test env:

```bash
# Example: docker test stack or .env.test pointing at a running DB
pnpm test:e2e
```

The smoke test in `tests/app.e2e-spec.ts` expects `GET /` → `200` + `Hello World!`. If the app root route differs, update the test in a later phase — out of scope for Phase 0 scaffolding.

## What Phase 0 did not change

- No files under `src/api/`, `src/_repositories/`, or `src/common/`
- No schema or migration changes
- No API routes or behavior changes

**Next**

**Phase 1** — Done (2026-08-11). See below.

**Phase 2** — Done (2026-08-11). See Phase 2 record below.

**Phase 3** — Order repository migration (persistence only).

---

## Phase 1 record (2026-08-11)

| Item | Status |
|------|--------|
| `src/libs/db/types/` — `DrizzleTx`, `TLockTransaction` | Done |
| `@/libs/*` path alias | Done |
| ESLint `no-restricted-imports` (warn) | Done — **106** legacy schema-import warnings |
| `tsc`, `lint` | Pass (0 errors) |

Canonical imports:

```typescript
import type { DrizzleTx, TLockTransaction } from '@/libs/db/types';
```

Legacy `@/_repositories/_types/lock.transaction` re-exports `TLockTransaction` until repos migrate.

---

## Phase 2 record (2026-08-11)

| Item | Status |
|------|--------|
| `src/modules/order/` folder structure | Done |
| `domain/order-status.ts`, `order-policy.ts`, `order.entity.ts`, `order-group.entity.ts` | Done |
| `OrderModule` registered in `AppModule` (no controllers) | Done |
| Legacy order API unchanged | Confirmed |
| `tsc`, `lint` | Pass |

Domain policy mirrors `OrderStatusTransitionService` transition graph and buyer/seller cancel rules. `OrderStatusTransitionService` remains in use until command cutover (Phases 6–10).

**Next:** Phase 40 — Public and admin reviews cutover.

---

## Phase 39 record (2026-08-12)

| Item | Status |
|------|--------|
| `BuyerReviewsController` at `v1/user/buyer/reviews` | Done |
| `SellerReviewsController` at `v1/user/seller/...` | Done |
| `CreateBuyerReviewCommand`, `ReportSellerReviewCommand` | Done |
| `ListBuyerReviewsQuery`, `GetBuyerReviewEligibilityQuery`, `ListSellerProductReviewsQuery` | Done |
| Deleted `src/api/user/buyer/reviews/`, `src/api/user/seller/reviews/` | Done |
| `ReviewModule` exports only `ReviewQueryService` + `ReviewRepository` (legacy admin/public) | Done |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 38 record (2026-08-11)

| Item | Status |
|------|--------|
| `modules/review/` skeleton (`Review` entity, policy, mapper) | Done |
| `ReviewRepository` moved from `_repositories/review/` | Done |
| `ReviewQueryService` for order + shop cross-module reads | Done |
| `ReviewModule` registered in `AppModule` | Done |
| `OrderReviewIntegration` uses `ReviewQueryService` | Done |
| Legacy `src/api/**/reviews/` unchanged (imports `ReviewModule`) | Confirmed |
| Deleted `_repositories/review/review.repository/` | Done |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 37 record (2026-08-11)

| Item | Status |
|------|--------|
| Order queries use `CatalogQueryService.getProductSummaries` | Done |
| `loadProductSummaries` / `product-summary.util` mappers | Done |
| Product joins removed from `OrderRepository` item loads | Done |
| `CatalogModule` imported in `OrderModule` | Done |
| `CatalogModule` exports only `CatalogQueryService` cross-module | Done |
| No catalog code under `src/api/` or `_repositories/library/` | Done |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 36 record (2026-08-11)

| Item | Status |
|------|--------|
| `PublicPlantsController` at `v1/plants` | Done |
| `ListPublicPlantsQuery` / `GetPublicPlantBySlugQuery` | Done |
| `CatalogQueryService.getProductSummaries` via `ProductRepository` | Done |
| Deleted `src/api/public/plants/` | Done |
| Removed `PublicPlantsModule` from `PublicApiModule` | Done |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 35 record (2026-08-11)

| Item | Status |
|------|--------|
| `SellerPlantsController` at `v1/user/seller/plants` | Done |
| Plant list/get/status/delete queries/commands | Done |
| `AdminProductsController` at `v1/admin/products` | Done |
| `ProductAdminRepository` + admin product queries/commands | Done |
| Deleted `src/api/user/seller/plants/` | Done |
| Deleted `src/api/admin/products/` | Done |
| Removed `PlantsModule` / `AdminProductsModule` from API modules | Done |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 34 record (2026-08-11)

| Item | Status |
|------|--------|
| `CreatePlantCommand` / `UpdatePlantCommand` in catalog | Done |
| `PlantPublishValidator` (publish readiness checks) | Done |
| DTOs canonical in `modules/catalog/controllers/dto/` | Done |
| `PlantsService` delegates create/update to catalog commands | Done |
| Deleted `create-plant.service.ts` / `update-plant.service.ts` | Done |
| Uses modular `InventoryRepository` via `InventoryModule` | Done |
| Routes unchanged (`v1/user/seller/plants` POST/PATCH) | Confirmed |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

**Note:** Persistence SQL remains in commands (schema in application layer); extract to `PlantWriteRepository` in a follow-up hardening pass.

---

## Phase 33 record (2026-08-11)

| Item | Status |
|------|--------|
| `SellerProductsController` at `v1/user/seller/products` | Done |
| `ProductRepository` (list/detail/summary/overview) | Done |
| Seller product queries via `ShopQueryService` | Done |
| Deleted `src/api/user/seller/products/` | Done |
| Removed `ProductsModule` from `SellerApiModule` | Done |
| Inventory still on `user/seller/products` (unchanged) | Confirmed |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 32 record (2026-08-11)

| Item | Status |
|------|--------|
| `PublicCategoriesController` at `v1/tree-categories` | Done |
| `PublicTagsController` at `v1/tags` | Done |
| Public category/tag queries (no `db.client` in app) | Done |
| Deleted `src/api/public/categories/` + `tags/` | Done |
| Removed from `PublicApiModule` | Done |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 31 record (2026-08-11)

| Item | Status |
|------|--------|
| `AdminTagsController` / `AdminTagGroupsController` → catalog | Done |
| Tag + tag-group commands/queries + translations | Done |
| `TagAdminRepository` / `TagGroupAdminRepository` | Done |
| Deleted `src/api/admin/admin-taxonomy/` | Done |
| Removed from `AdminApiModule` | Done |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 30 record (2026-08-11)

| Item | Status |
|------|--------|
| `AdminCategoriesController` → `modules/catalog/controllers/` | Done |
| Commands: create/update/delete + translation upsert/delete | Done |
| Queries: list/tree/by-id/ancestors/translations | Done |
| `CategoryAdminRepository` owns admin SQL (no `db.client` in app) | Done |
| Deleted `src/api/admin/admin-taxonomy/categories/` | Done |
| `AdminCategoriesModule` removed from `AdminApiModule` | Done |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 29 record (2026-08-11)

| Item | Status |
|------|--------|
| `modules/catalog/` skeleton | Done |
| Taxonomy repos → `modules/catalog/repositories/` | Done |
| `CatalogQueryService` stub (`getProductSummaries`) | Done |
| `CatalogModule` in `AppModule` | Done |
| Admin taxonomy + seller plants import `CatalogModule` | Done |
| Deleted `_repositories/library/taxonomy/` | Done |
| Repo exports temporary until Phases 30–34 | Documented |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 28 record (2026-08-11)

| Item | Status |
|------|--------|
| `ShopQueryService` exported for catalog/guards/notifications | Done |
| External callers rewired off `ShopRepository` | Done |
| `getShopContactByShopId` on consolidated `ShopRepository` | Done |
| Deleted fragment repos: address, contact, business, manager | Done |
| Core shop API already migrated (phases 19–27) | Confirmed |
| `shop-campaign` / `shop-article` repos remain (separate domains) | Deferred |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 27 record (2026-08-11)

| Item | Status |
|------|--------|
| Public shop queries → `modules/shop/application/queries/` | Done |
| `PublicShopController` at `v1/shops` | Done |
| DTOs/mappers moved to `modules/shop/` | Done |
| `ReviewRepositoryModule` import (duplicate provider removed) | Done |
| Deleted `src/api/public/shops/` (16 files) | Done |
| `PublicShopsModule` removed from `PublicApiModule` | Done |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 26 record (2026-08-11)

| Item | Status |
|------|--------|
| `ShopFollowRepository` → `modules/shop/repositories/` | Done |
| `BuyerShopFollowController` at `v1/user/buyer/shops` | Done |
| `FollowShopCommand` / `UnfollowShopCommand` / `ListFollowingShopsQuery` | Done |
| Public shops + seller analytics import follow repo from `ShopModule` | Done |
| Deleted `src/api/user/buyer/shop-follow/` + legacy follow repo | Done |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 25 record (2026-08-11)

| Item | Status |
|------|--------|
| `ShopShippingRatesRepository` → `modules/shop/repositories/` | Done |
| `SellerShippingRatesController` at `v1/user/seller/shipping-rates` | Done |
| `GetShippingRatesQuery` + `BulkUpdateShippingRatesCommand` | Done |
| Order place/price-breakdown still uses `OrderRepository.getShopShippingRatesForDistrict` | Unchanged |
| Deleted `src/api/user/seller/shipping-rates/` + legacy shipping-rates repo | Done |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 24 record (2026-08-11)

| Item | Status |
|------|--------|
| `ShopStorefrontRepository` → `modules/shop/repositories/` | Done |
| `SellerStorefrontController` at `v1/user/seller/storefront` | Done |
| Queries/commands: get, update profile, replace why-choose-us / value-points | Done |
| Public shops use `ShopModule` export for storefront repo | Done |
| Deleted `src/api/user/seller/storefront/` + legacy storefront repo | Done |
| No `VerifiedUserAuthGuardModule` import on `ShopModule` (cycle avoided) | Confirmed |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 23 record (2026-08-11)

| Item | Status |
|------|--------|
| `ShopVerificationRepository` + history → `modules/shop/repositories/` | Done |
| Seller verification queries/commands on `SellerShopProfileController` | Done |
| Admin shops controller + approve/reject/suspend/deactivate/reactivate | Done |
| Domain entity used for submit/resubmit/approve/reject/suspend paths | Done |
| Deleted `src/api/admin/admin-shop/` | Done |
| Deleted `src/api/user/seller/shop/` | Done |
| Removed legacy verification `_repositories` | Done |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 22 record (2026-08-11)

| Item | Status |
|------|--------|
| `ApplyAsSellerCommand` — create shop + translations + media | Done |
| `UpsertMyShopContactCommand` — contact + social | Done |
| `UpdateMyShopAddressCommand` — address + EN/BN translations | Done |
| `ShopProfileSectionService` — shared lock + map helper | Done |
| Routes on `SellerShopProfileController` (apply, contact, address) | Done |
| Removed apply/contact/address from legacy `ShopService` / controller | Done |
| Contact/address still via `ShopRepository` aggregate (no separate contact repo move) | Done |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 21 record (2026-08-11)

| Item | Status |
|------|--------|
| `SellerShopProfileController` — profile GET/PATCH/PUT routes | Done |
| Queries: `GetShopStatusQuery`, `GetMyShopQuery` | Done |
| Commands: `UpdateMyShopCommand`, `UpdateMyShopBrandingCommand`, `UpsertMyShopInfoCommand` | Done |
| `shop.mapper.ts` — localized shop response mapping | Done |
| Profile routes removed from legacy `shop.controller.ts` | Done |
| Legacy `ShopService` delegates contact/address/verification only | Done |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 20 record (2026-08-11)

| Item | Status |
|------|--------|
| `ShopRepository` → `modules/shop/repositories/` | Done |
| `shop.repository.mapper.ts` — row ↔ entity + translation records | Done |
| Entity helpers: `createShopEntity`, `getShopEntityById`, `updateShopEntity`, etc. | Done |
| All legacy callers import `ShopModule` / `@/modules/shop/repositories` | Done |
| Deleted `_repositories/business/shop.repository/` | Done |
| Legacy shop HTTP unchanged | Confirmed |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 19 record (2026-08-11)

| Item | Status |
|------|--------|
| `modules/shop/` skeleton | Done |
| `Shop` entity — status, verification, publish rules | Done |
| `shop-policy.ts` — transitions, public visibility, resubmit guards | Done |
| `ShopModule` registered in `AppModule` (no controllers/repos) | Done |
| Legacy shop API unchanged | Confirmed |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

Domain policy mirrors legacy `shop.service.ts` + `admin-shop.service.ts` lifecycle (submit, approve/reject, suspend/deactivate/reactivate, public ACTIVE-only visibility).

---

## Phase 18 record (2026-08-11)

| Item | Status |
|------|--------|
| `PublicPaymentMethodsController` → `modules/payment/controllers/` | Done |
| `ListActivePaymentMethodsQuery` for public catalog | Done |
| `PaymentQueryService.resolveActivePaymentMethod` for checkout | Done |
| `PlaceOrderCommand` uses `PaymentQueryService` (not integration) | Done |
| Removed `OrderPaymentMethodIntegration` | Done |
| `PaymentMethodRepository` no longer exported from `PaymentModule` | Done |
| Deleted `src/api/public/payment-methods/` | Done |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 17 record (2026-08-11)

| Item | Status |
|------|--------|
| `AdminPaymentMethodsController` → `modules/payment/controllers/` | Done |
| Queries: `ListPaymentMethodsQuery`, `GetPaymentMethodQuery` | Done |
| Commands: create, update, activate, deactivate | Done |
| `PaymentMethodLogoService` in module application layer | Done |
| Deleted `src/api/admin/payment-methods/` | Done |
| `AdminApiModule` no longer imports payment-methods module | Done |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 16 record (2026-08-11)

| Item | Status |
|------|--------|
| `modules/payment/` — `PaymentMethodRepository` moved from `_repositories/payment/` | Done |
| `PaymentRepository` — `payments` table (module-private) | Done |
| `Payment` entity + COD status policy | Done |
| `PaymentModule` in `AppModule`; legacy admin/public import `PaymentModule` | Done |
| Deleted `_repositories/payment/payment-method.repository/` | Done |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 15 record (2026-08-11)

| Item | Status |
|------|--------|
| `CartController` + DTOs → `modules/cart/controllers/` | Done |
| `WishlistController` + DTOs in cart module | Done |
| `CartFacade` orchestrates commands/queries (replaces legacy services) | Done |
| `WishlistRepository` + list/add/remove query/commands | Done |
| `CartMergeListener` in module | Done |
| Deleted `src/api/user/buyer/cart/`, `wishlist/`, `_repositories/user/wishlist.repository/` | Done |
| `BuyerApiModule` no longer imports cart/wishlist | Done |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 14 record (2026-08-11)

| Item | Status |
|------|--------|
| `AddToCartCommand`, `UpdateCartItemCommand`, `RemoveCartItemCommand` | Done |
| `ClearCartCommand`, `BulkUpdateCartCommand`, `BulkRemoveCartCommand` | Done |
| `MergeCartCommand`, `MergeGuestCartCommand`, `ResolveCartContextCommand` | Done |
| `CartCommandService.removeOrderedItems(tx)` for checkout | Done |
| `getVariantForCartOperation` on repository; shared assert + mapper helpers | Done |
| Legacy cart mutation services delegate to commands | Done |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 13 record (2026-08-11)

| Item | Status |
|------|--------|
| `GetCartQuery` — cart + items + stock mapping | Done |
| `GetCartCountQuery` — lightweight count for navbar badge | Done |
| `ValidateCartQuery` — pre-checkout validation | Done |
| `modules/cart/mappers/cart.mapper.ts` — item + cart result mapping | Done |
| `computeCartTotals` → `@/libs/cart/totals.util` | Done |
| Legacy `GetCartService` / `ValidateCartService` delegate to queries | Done |
| `cart.service.getCartCount` uses `GetCartCountQuery` | Done |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 12 record (2026-08-11)

| Item | Status |
|------|--------|
| `modules/cart/` — repository moved from `_repositories/user/cart.repository/` | Done |
| `CartQueryService` + `CartCommandService` skeleton (delegate to repo) | Done |
| `CartModule` registered in `AppModule` | Done |
| Legacy buyer cart API imports `CartDomainModule` + `CartRepository` | Done |
| `OrderCartIntegration` uses `CartQueryService` / `CartCommandService` | Done |
| Deleted `_repositories/user/cart.repository/` | Done |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

**Temporary debt:** Legacy cart services still inject `CartRepository` directly until Phases 13–14 migrate to query/command services.

---

## Phase 11 record (2026-08-11)

| Item | Status |
|------|--------|
| `OrderIntegrationsModule` — cart, address, payment, review bridges | Done |
| `computeStockStatus` / `computeLineTotal` → `@/libs/cart/stock.util` | Done |
| `UUIDSchema` → `@/common/schemas/uuid.schema` | Done |
| Removed `CheckoutPaymentMethodService` (replaced by integration) | Done |
| Zero `api/` / `_repositories/` imports under `modules/order/` | Done |
| `modules/order/README.md` — exports + cross-module table | Done |
| `ListAdminOrdersQuery` user/shop names — deferred to User/Catalog phases | Documented |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

**Temporary debt (via integrations):** cart, address, payment, review until respective modules exist. Admin list still uses repository relations for user/shop display names.

---

## Phase 10 record (2026-08-11)

| Item | Status |
|------|--------|
| `SellerOrdersController` — `user/seller/orders` | Done |
| `AdminOrdersController` — `admin/orders` | Done |
| Mappers moved to `modules/order/mappers/` (seller, admin, seller-order-actions) | Done |
| `seller-order-actions` uses domain `getAllowedOrderTransitions` | Done |
| Deleted `src/api/user/seller/orders/`, `src/api/admin/orders/` | Done |
| Deleted `_repositories/user/order.repository/` | Done |
| Deleted `common/services/order/` (`OrderInventoryService`, `OrderStatusTransitionService`) | Done |
| `AdminUsersService` uses `GetAdminOrderStatsQuery` + `ListAdminOrdersQuery` | Done |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 9 record (2026-08-11)

| Item | Status |
|------|--------|
| `BuyerOrdersController` — `user/buyer/orders` | Done |
| `BuyerCheckoutController` — `user/buyer/checkout` | Done |
| DTOs moved to `modules/order/controllers/dto/` | Done |
| `CalculatePriceBreakdownQuery` in module | Done |
| Deleted `src/api/user/buyer/checkout/` and `orders/` | Done |
| `BuyerApiModule` no longer imports checkout/orders modules | Done |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 8 record (2026-08-11)

| Item | Status |
|------|--------|
| `PlaceOrderCommand` — checkout orchestration in `modules/order` | Done |
| `OrderRepository.nextOrderNumber({ tx })` — fixes in-tx `db.client` bug | Done |
| `getShopShippingRatesForDistrict`, `getDistrictTranslatedName` on repo | Done |
| Inventory reserve + cart clear in same `{ tx }` as order creation | Done |
| `OrderPlaced` event emitted after commit | Done |
| Legacy `place-order.service.ts` delegates; `checkout.module` imports `OrderModule` only for orders | Done |
| `calculate-price-breakdown` | Unchanged (deferred) |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

**Temporary debt (Phase 8–10, closed in Phase 11):** checkout cross-module access now goes through `@/common/integrations/order`.

---

## Phase 7 record (2026-08-11)

| Item | Status |
|------|--------|
| `CancelSellerOrderCommand` — entity `cancelBySeller`, inventory release in `{ tx }` | Done |
| `ShipSellerOrderCommand` — shipment create, `markShipped`, inventory fulfill in `{ tx }` | Done |
| `UpdateSellerOrderStatusCommand` — entity `updateStatusBySeller`, shipment on DELIVERED | Done |
| `assertOrderNotStale` moved to `modules/order/application/` | Done |
| Entity: `updateStatusBySeller`, `prepareForShipment`, `markShipped`, COD `complete()` | Done |
| Legacy seller mutation services delegate to commands | Done |
| Seller `orders.module.ts` imports only `OrderModule` | Done |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

**Temporary debt:** Seller response mappers still under `api/user/seller/orders/`; `seller-order-actions.util.ts` still uses `OrderStatusTransitionService` for read-side action descriptors.

---

## Phase 6 record (2026-08-11)

| Item | Status |
|------|--------|
| `CancelBuyerOrderCommand` — entity rules, `OrderRepository.save`, inventory release in `{ tx }` | Done |
| `ConfirmDeliveryCommand` — entity `confirmDelivery()`, shipment update, status history in `{ tx }` | Done |
| Legacy `cancel-order.service.ts` / `confirm-delivery.service.ts` delegate to commands | Done |
| `OrderModule` imports `InventoryModule`; exports buyer commands | Done |
| Buyer `orders.module.ts` imports only `OrderModule` (legacy repo/services removed) | Done |
| `tsc`, `lint` | Pass (0 errors) |
| `e2e` | Not re-run here — re-run locally with DB/env |

---

## Phase 5 record (2026-08-11)

| Item | Status |
|------|--------|
| `application/queries/` — buyer, seller, admin read services | Done |
| `mappers/` — buyer list/group + `mapStatusHistoryActor` | Done |
| `OrderRepository.getBuyerOrderGroupWithDetails()` | Done |
| Legacy read services delegate to query classes | Done |
| `OrderModule` exports query services; buyer/seller/admin modules import `OrderModule` | Done |
| `tsc`, `lint` | Pass (0 errors; 108 schema-import warnings) |
| `e2e` | Not re-run here — re-run locally with DB |

**Temporary debt (closed Phase 38):** order review enrichment uses `ReviewQueryService` via `OrderReviewIntegration`. Legacy review HTTP still under `src/api/` until Phases 39–40.

---

## Phase 4 record (2026-08-11)

| Item | Status |
|------|--------|
| `modules/inventory/` skeleton + `Inventory` entity | Done |
| `InventoryRepository` in module (`schema/inventory` imports) | Done |
| `InventoryCommandService` (`reserveForOrder`, `releaseOrderReservation`, `fulfillOrder`) | Done |
| `InventoryModule` exports command service only | Done |
| Legacy `OrderInventoryService` + `_repositories/.../inventory.repository` | Unchanged |
| `OrderModule` does not import `InventoryModule` yet | Confirmed |
| `tsc`, `lint` | Pass |

---

## Phase 3 record (2026-08-11)

| Item | Status |
|------|--------|
| `modules/order/repositories/order.repository.ts` | Done (copied from legacy + entity mapping) |
| `order.repository.mapper.ts`, `order.repository.types.ts` | Done |
| Schema imports: `schema/order`, `schema/shipping` | Done |
| `OrderRepository` in `OrderModule` (not exported yet) | Done |
| Legacy `_repositories/user/order.repository` | Unchanged |
| `tsc`, `lint` | Pass |

Core entity methods: `getOrderById`, `getOrderByIdAndUserId`, `getOrderByIdAndShopId`, `createOrder`, `updateOrder`, `save`, `createOrderGroup`. Row helpers `getOrderRowById*` retained for transitional list queries with cross-module relations (refactor in Phase 5+).
