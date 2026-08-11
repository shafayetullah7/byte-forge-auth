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

**Next:** Phase 12 — Cart module skeleton and repository.

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

**Temporary debt:** `GetOrderGroupQuery` injects legacy `ReviewRepository`; seller/admin queries still import mappers from `api/` until controller cutover (Phase 9+).

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
