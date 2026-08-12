# Modular Monolith Refactor Playbook

> **Scope:** `byte-forge-auth` only.  
> **Read first:** [architecture.md](./architecture.md)  
> **Phased plan (master):** [refactor-phases.md](./refactor-phases.md) — 57 phases with exit criteria

This playbook summarizes **how** to migrate each domain. For **when** and **in what order**, follow [refactor-phases.md](./refactor-phases.md).

---

## Principles

1. **One domain at a time** — strangler pattern; e2e must pass after each domain.
2. **Routes frozen** — copy exact `@Controller()` paths from legacy controllers.
3. **Behavior preserved or improved** — especially locks, optimistic concurrency, and ACID checkout.
4. **No auth migration** — session vs JWT v2 is out of scope.
5. **No new migrations** unless schema columns actually change.
6. **Dead code removed when touched** (orphan repos, duplicate session repository).

---

## Phase 0 — Preparation (before Order)

### 0.1 Create target skeleton

```
src/modules/order/
├── order.module.ts
├── controllers/
├── application/commands/
├── application/queries/
├── domain/
├── repositories/
├── dto/
└── mappers/
```

### 0.2 Plan `libs/` rename

- New code uses `src/libs/` for infrastructure.
- `src/common/` remains until imports are migrated domain-by-domain (or alias `@/libs` → `@/common` temporarily).
- Move `common/services/order/*` into `modules/order/` as part of Phase 1.

### 0.3 Add ESLint restricted imports (recommended)

Block application/controllers from importing `@/_db/drizzle/schema` except in `**/repositories/**`.  
See `.cursor/rules/modular-monolith.mdc`.

### 0.4 Baseline verification

```bash
npx tsc --noEmit --incremental false
pnpm lint
pnpm test:e2e
```

Record passing state — same commands must pass after Phase 1.

---

## Phase 1 — Order module (first domain)

**Why first:** Highest transactional sensitivity (checkout, inventory reservation, cancel, ship). ADR-0001 lifecycle rules already exist.

### 1.1 Inventory map

| Legacy location | Target location |
|-----------------|-----------------|
| `api/user/buyer/checkout/**` | `modules/order/controllers/buyer-checkout.controller.ts` + commands |
| `api/user/buyer/orders/**` | `modules/order/controllers/buyer-orders.controller.ts` + commands/queries |
| `api/user/seller/orders/**` | `modules/order/controllers/seller-orders.controller.ts` + commands/queries |
| `api/admin/orders/**` | `modules/order/controllers/admin-orders.controller.ts` + commands/queries |
| `_repositories/user/order.repository/**` | `modules/order/repositories/order.repository.ts` |
| `common/services/order/order-inventory.service.ts` | `modules/inventory/application/commands/` OR `modules/order/application/` delegating to inventory command |
| `common/services/order/order-status-transition.service.ts` | `modules/order/domain/` + `modules/order/application/commands/` |

**Decision:** `OrderInventoryService` moves to **Inventory module** as `InventoryCommandService.reserveForOrder(tx)` — Order command calls it with shared `tx`. Transition rules stay in **Order domain**.

### 1.2 Create domain layer

1. Add `domain/order-status.ts` — enum matching existing `OrderStatusEnum`.
2. Add `domain/order.entity.ts` — `cancel()`, `ship()`, `canBeCancelled()` mirroring current transition service rules.
3. Add `domain/order-group.entity.ts` if needed for checkout.
4. Unit behavior must match `OrderStatusTransitionService` + ADR-0001 (manual/e2e verification until unit tests exist).

### 1.3 Move repository

1. Copy `order.repository` to `modules/order/repositories/order.repository.ts`.
2. Map rows ↔ entities on `findById`, `save`, etc.
3. All methods accept optional `tx` / `TLockTransaction` where they do today.
4. Move any raw Drizzle in `place-order.service` (order number generation, etc.) **into the repository**.
5. Repository imports only `@/_db/drizzle/schema/order` (and `shipping` if order-address/shipment owned by order — confirm ownership).

### 1.4 Split application services

| Legacy service | Target command/query |
|----------------|---------------------|
| `place-order.service.ts` | `application/commands/place-order.command.ts` |
| `cancel-order.service.ts` | `application/commands/cancel-buyer-order.command.ts` |
| `cancel-seller-order.service.ts` | `application/commands/cancel-seller-order.command.ts` |
| `ship-seller-order.service.ts` | `application/commands/ship-seller-order.command.ts` |
| `confirm-delivery.service.ts` | `application/commands/confirm-delivery.command.ts` |
| `get-orders.service.ts` | `application/queries/get-buyer-orders.query.ts` |
| `get-order-group.service.ts` | `application/queries/get-order-group.query.ts` |
| Admin list/detail | `application/queries/list-admin-orders.query.ts` |

**place-order.command.ts checklist:**
- [ ] Service opens `db.transaction`
- [ ] Passes `{ tx }` to order repo, cart command, inventory command
- [ ] No `this.db.client` in command — all queries in repos
- [ ] Stock check + reservation logic preserved
- [ ] Order number generation inside order repository (with `tx`)
- [ ] Events emitted after commit (or same as current behavior)
- [ ] Shipping rate lookup via **Shop** or **Order** query API — not raw schema import in command

### 1.5 Export public APIs

```typescript
// modules/order/order.module.ts
exports: [OrderQueryService]  // if other modules need order summaries

// modules/inventory/inventory.module.ts
exports: [InventoryCommandService, InventoryQueryService]
```

### 1.6 Move controllers

1. Copy controllers verbatim (routes, guards, decorators).
2. Update constructor injections to new command/query classes.
3. Keep mappers/DTOs colocated in `modules/order/dto/` and `mappers/`.

### 1.7 Wire module

```typescript
@Module({
  imports: [CartModule, InventoryModule, PaymentModule, CatalogModule, UserModule, ShopModule],
  controllers: [
    BuyerCheckoutController,
    BuyerOrdersController,
    SellerOrdersController,
    AdminOrdersController,
  ],
  providers: [
    OrderRepository,
    PlaceOrderCommand,
    // … all commands/queries
    OrderQueryService,
  ],
  exports: [OrderQueryService],
})
export class OrderModule {}
```

Register `OrderModule` in `AppModule`. **Remove** legacy order imports from `UserApiModule` / `AdminApiModule` only when controllers are fully moved.

### 1.8 Delete legacy (same PR or follow-up)

- Remove `api/user/buyer/checkout/`, `api/user/buyer/orders/`, `api/user/seller/orders/`, `api/admin/orders/`
- Remove `_repositories/user/order.repository/`
- Remove `common/services/order/` after inventory command extracted

### 1.9 Verify

```bash
npx tsc --noEmit --incremental false
pnpm lint
pnpm test:e2e   # checkout, cancel, ship flows critical
```

---

## Phase 2 — Inventory module

1. Move `_repositories/business/inventory.repository/`.
2. Add `Inventory` entity (reserve, release, adjust).
3. Export `InventoryCommandService` with `reserveForOrder(items, orderId, userId, tx)`.
4. Seller inventory endpoints → `modules/inventory/controllers/`.
5. Verify seller stock adjust/restock e2e.

---

## Phase 3 — Cart module

1. Move cart + wishlist repos and buyer endpoints.
2. Export `CartCommandService.clearItems(cartId, itemIds, tx)` for checkout.
3. Verify cart merge, checkout e2e.

---

## Phase 4 — Payment module

1. Payment methods (admin/public) + payment records repo.
2. Add `Payment` entity where status transitions exist.
3. Export `PaymentQueryService` for checkout.

---

## Phase 5 — Shop module

1. Split `shop.service.ts` (~1000 lines) into commands/queries.
2. Add `Shop` entity (verification state, etc.).
3. Move verification, storefront, follow, seller shop, admin shops, public shops.
4. Multiple shop repos merge into aggregate `ShopRepository` where sensible.

---

## Phase 6 — Catalog module

1. Products, plants, variants, taxonomy (admin + public).
2. Export `CatalogQueryService.getProductSummaries(ids)`.
3. Move direct Drizzle in `list-plants`, `admin-categories`, etc. into repositories.

---

## Phase 7 — Remaining modules

| Order | Module |
|-------|--------|
| 7 | Auth (structure only — no session→JWT change) |
| 8 | User |
| 9 | Review |
| 10 | Content (articles, campaigns) |
| 11 | Media |
| 12 | Location |
| 13 | Notification |
| 14 | Platform (health, i18n) |

---

## Per-domain checklist (copy for each migration)

### Structure
- [ ] `modules/{domain}/{domain}.module.ts` created
- [ ] Controllers under `controllers/` with **unchanged** route paths
- [ ] `application/commands/` and `application/queries/` separated
- [ ] `repositories/` — only place with Drizzle
- [ ] `domain/` entities for Order, Inventory, Shop, Payment (when applicable)

### Boundaries
- [ ] No `DrizzleService.client` in application/controllers
- [ ] No cross-module schema imports
- [ ] No cross-module repository imports
- [ ] Other modules accessed via exported query/command services only

### Transactions
- [ ] Commands that mutate state use explicit transaction where legacy did
- [ ] Cross-module writes pass same `tx`
- [ ] Row locks preserved (`for update`, `assertOrderNotStale`)

### API contract
- [ ] Response shapes unchanged (mappers produce same DTOs)
- [ ] Error codes unchanged (`404`, `409`, `403`, etc.)
- [ ] i18n keys unchanged

### Cleanup
- [ ] Legacy `api/` folder for this domain removed
- [ ] Legacy `_repositories/` for this domain removed
- [ ] Dead code touched in this area removed

### Verification
- [ ] `tsc`, `lint`, `test:e2e` pass

---

## What NOT to do during refactor

- Change API paths or response contracts
- Migrate user auth from session to JWT v2
- Rename package / project folder
- Run `db:generate` / `db:migrate` unless schema columns changed
- Big-bang delete entire `src/api/` before domains are migrated
- Add cross-module SQL joins to "save round trips"

---

## Suggested PR sizing

| PR | Contents |
|----|----------|
| PR 1 | Order module skeleton + repository + domain entities (no route switch) |
| PR 2 | Order commands (place, cancel, ship) + transaction parity |
| PR 3 | Order controllers switched + legacy deleted + e2e green |
| PR 4+ | Next domain |

Small PRs are easier to review and rollback.

---

## When is the refactor "done"?

**Done (2026-08-12).** See [REFACTOR_COMPLETE.md](./REFACTOR_COMPLETE.md).

- `src/api/` deleted
- `src/_repositories/` deleted
- `src/common/` renamed to `src/libs/` (infra only)
- All domains under `src/modules/`
- ESLint structural boundaries enforced (`@/api`, `@/_repositories`, `@/common` → error)
- E2e suite green — **verify locally** (smoke checklist in REFACTOR_COMPLETE.md)

**Follow-up (non-blocking):** schema imports in application layer (~87 ESLint warnings); cross-module repository exports → query/command facades.
