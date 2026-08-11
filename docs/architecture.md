# Byte Forge Auth — Modular Monolith Architecture

> **Scope:** `byte-forge-auth` only.  
> **Goal:** One deployable NestJS app with strict domain boundaries, clear layers, and a path to microservice extraction later — **without changing existing API routes or reducing transactional correctness.**

Related docs:
- [Refactor Playbook](./refactor-playbook.md) — phased migration steps (start with Order)
- [Cross-Module Transactions](./cross-module-transactions.md) — ACID patterns, optional `tx`
- [Backend Playbook](./backend-playbook.md) — day-to-day endpoint workflow
- [API Contract Conventions](./api-contract-conventions.md) — DTOs, responses, errors

---

## 1. What we are building

This backend is a **modular monolith**:

| Property | Value |
|----------|-------|
| Deployable units | **One** (single NestJS process) |
| Database | **One** PostgreSQL database (for now) |
| Module boundaries | **Strong** — each domain owns its data and rules |
| API surface | **Unchanged** — same `/api/v1/...` routes during refactor |
| Auth migration (session → JWT v2) | **Out of scope** for structural refactor |

**Admin, buyer, seller, and public are audiences — not domains.**  
Do not create an `AdminModule`. Put `admin-*.controller.ts` inside the domain that owns the data (e.g. `admin-order.controller.ts` lives in `modules/order/`).

---

## 2. Target folder structure

```
byte-forge-auth/src/
├── modules/                    # Business domains (target home for all features)
│   ├── order/
│   │   ├── order.module.ts
│   │   ├── controllers/
│   │   │   ├── admin-order.controller.ts
│   │   │   ├── buyer-order.controller.ts
│   │   │   └── seller-order.controller.ts
│   │   ├── application/
│   │   │   ├── commands/       # Mutations (place-order, cancel, ship, …)
│   │   │   └── queries/        # Read models / list DTOs
│   │   ├── domain/
│   │   │   ├── order.entity.ts
│   │   │   └── order-status.ts
│   │   ├── repositories/
│   │   │   └── order.repository.ts
│   │   ├── dto/
│   │   └── mappers/
│   ├── catalog/
│   ├── shop/
│   ├── inventory/
│   ├── cart/
│   ├── payment/
│   ├── auth/
│   ├── user/
│   ├── review/
│   ├── content/
│   ├── media/
│   ├── location/
│   ├── notification/
│   └── platform/
├── libs/                       # Infrastructure only (renamed from common/)
│   ├── guards/
│   ├── db/                     # DrizzleModule, DrizzleService (or keep _db at root)
│   ├── config/
│   ├── email/
│   ├── events/
│   └── …
├── _db/drizzle/                # Schema source + migrations (unchanged location)
│   ├── schema/
│   │   ├── order/              # Domain subfolder + barrel index.ts
│   │   ├── shop/
│   │   └── index.ts            # Re-exports all domains
│   └── migrations/
├── i18n/
├── app.module.ts
└── main.ts
```

### Legacy paths (being removed)

| Legacy | Replacement |
|--------|-------------|
| `src/api/**` | `src/modules/{domain}/controllers/**` |
| `src/_repositories/**` | `src/modules/{domain}/repositories/**` |
| `src/common/**` (infra) | `src/libs/**` |
| `src/common/services/order/**` | `src/modules/order/application/**` |

Migrate **one domain at a time** (strangler). Do not big-bang delete `src/api/` until each domain is moved.

---

## 3. Domain modules

| Module | Owns (data + rules) | Example controllers |
|--------|---------------------|---------------------|
| **Auth** | User/admin sessions, OTP, password reset | `user-auth`, `admin-auth`, `password-reset` |
| **User** | Profile, addresses, admin user ops | `user-profile`, `buyer-addresses`, `admin-users` |
| **Shop** | Shop, verification, storefront, follow | `seller-shop`, `admin-shops`, `public-shops` |
| **Catalog** | Products, plants, variants, **taxonomy** | `seller-plants`, `public-plants`, `admin-categories` |
| **Inventory** | Stock, movements | `seller-inventory` |
| **Cart** | Cart, wishlist | `buyer-cart`, `buyer-wishlist` |
| **Order** | Checkout, orders, order groups, order shipping context | `buyer-checkout`, `buyer-orders`, `seller-orders`, `admin-orders` |
| **Payment** | Payment methods, payment records | `admin-payment-methods`, `public-payment-methods` |
| **Review** | Reviews, reports | `buyer-reviews`, `seller-reviews`, `admin-reviews`, `public-reviews` |
| **Content** | Shop articles, campaigns | `seller-articles`, `admin-articles`, public shop content |
| **Media** | Uploads | `media` |
| **Location** | Divisions, districts | `public-location` |
| **Notification** | Email, domain events | (internal; no HTTP or event listeners only) |
| **Platform** | Health, i18n languages, cross-cutting admin config | `health`, `admin-languages` |

---

## 4. Layer responsibilities

Each layer answers one question:

| Layer | Question | May do | Must NOT do |
|-------|----------|--------|-------------|
| **Controller** | What HTTP request came in? | Parse DTOs, apply guards, call application service, return response | Business rules, DB queries, transactions |
| **Application** (commands/queries) | What should the use case do? | Orchestrate, enforce permissions, start transactions, compose DTOs | Raw SQL/Drizzle, HTTP details |
| **Domain** | What are the business rules? | Entities, status enums, invariants (`order.cancel()`) | HTTP, Drizzle, other modules' tables |
| **Repository** | How do I persist? | Drizzle queries, row ↔ entity mapping, accept optional `tx` | Business rules, cross-domain joins |

### Request flow

```
HTTP Request
  → Controller (guards, DTO)
  → Application Command or Query
  → Domain Entity (when rules exist)
  → Repository (Drizzle)
  → PostgreSQL
```

### Application layer split

```
application/
├── commands/     # Mutations: place-order, cancel-order, adjust-stock
└── queries/      # Reads: get-my-orders, list-admin-orders
```

- **Commands** may open transactions and call other modules' **command** services with `{ tx }`.
- **Queries** compose read models by calling own repository + other modules' **query** services (batch IDs, no N+1).

---

## 5. Domain entities

Drizzle schema rows are **not** domain entities. Keep them separate.

| Drizzle schema (`_db/drizzle/schema/`) | Domain entity (`modules/*/domain/`) |
|----------------------------------------|-------------------------------------|
| How data is stored | Business object with behavior |
| `OrderRow` from `$inferSelect` | `Order` class with `cancel()`, `canBeShipped()` |
| No business logic | State transitions and invariants |

**Required full entities (target):** Order, Inventory, Shop, Payment.

Introduce pragmatically during refactor — behavior must match current production logic before deleting legacy code.

Repository maps: `row → entity` on read, `entity → row` on save.

---

## 6. Schema ownership (Drizzle)

Schema files stay in `src/_db/drizzle/schema/{domain}/` with a barrel `index.ts`.  
The root `schema/index.ts` re-exports all domains for `drizzle.config.ts`.

### Rules

1. **Only the owning module's repository** may import that domain's schema files.
2. **Never** import another module's schema from application services, controllers, or foreign repositories.
3. Reorganizing schema **files** (move + re-export, no column changes) does **not** require a migration.
4. Migration generation/execution remains **user-owned** — agents update schema source only.

```typescript
// ✅ OK — inside modules/order/repositories/order.repository.ts
import { ordersTable } from '@/_db/drizzle/schema/order';

// ❌ FORBIDDEN — inside modules/catalog/application/queries/list-products.query.ts
import { ordersTable } from '@/_db/drizzle/schema/order';
```

---

## 7. Repository boundary (strict)

> **Services initiate transactions. Only repositories execute DB queries.**

| Layer | DB access |
|-------|-----------|
| Controller | ❌ Never |
| Application service | ❌ Never (`DrizzleService.client` forbidden) |
| Query service (application) | ❌ Never — calls repositories or exported query APIs |
| Repository | ✅ Only place for Drizzle queries |

If a service today uses `this.db.client.query...`, that logic moves into a repository method during refactor.

---

## 8. Cross-module communication

### Inside a module: joins are fine

`OrderRepository` may join `orders` + `order_items` — same ownership boundary.

### Across modules: call the owner's public API

```
OrderModule
  ├── OrderRepository          (private)
  ├── PlaceOrderCommand        (uses CartCommandService, InventoryCommandService with tx)
  └── ListAdminOrdersQuery     (uses UserQueryService, CatalogQueryService)
```

**Never:**
- Import another module's repository
- Import another module's schema
- Import another module's domain entity

### Public API pattern

Each module exports **query** and/or **command** services:

```typescript
// modules/catalog/catalog.module.ts
@Module({
  providers: [CatalogRepository, CatalogQueryService, CatalogCommandService],
  exports: [CatalogQueryService, CatalogCommandService], // public
  // CatalogRepository is NOT exported
})
export class CatalogModule {}
```

Other modules inject `CatalogQueryService`, not `CatalogRepository`.

For lists, batch IDs:

```typescript
const productIds = [...new Set(items.map((i) => i.productId))];
const products = await this.catalogQuery.getProductSummaries(productIds);
```

See [Cross-Module Transactions](./cross-module-transactions.md) for write paths.

---

## 9. Controllers and API routes

**Routes must not change** during refactor. When moving a controller, copy the exact `@Controller(...)` path.

Examples (unchanged):

| Controller file | Route prefix |
|-----------------|--------------|
| `buyer-checkout.controller.ts` | `user/buyer/checkout` |
| `seller-orders.controller.ts` | `user/seller/orders` |
| `admin-orders.controller.ts` | `admin/orders` |
| `public-shops.controller.ts` | `shops` |

Global prefix remains `api` + URI version `v1` (see `main.ts`).

---

## 10. Transactions (summary)

- **Application command** owns the transaction boundary for a use case.
- Pass optional `tx` into repositories and cross-module command services.
- Keep **single-DB ACID** for checkout, cancel, ship (inventory + order in one transaction).
- Do not open nested transactions — pass the same `tx` through.

Full detail: [cross-module-transactions.md](./cross-module-transactions.md).

---

## 11. `libs/` (infrastructure)

`src/libs/` holds **actor-agnostic infrastructure**:

- Guards, decorators, filters
- DrizzleModule, config, logger
- Email, cookie, hashing, cloudinary, response wrapper
- Event bus (not domain events owned by a module)

**Does not belong in libs/:** order transition logic, shop business rules, anything domain-specific.

---

## 12. Module wiring

```typescript
// app.module.ts (simplified target)
@Module({
  imports: [
    DrizzleModule,
    AuthModule,
    UserModule,
    ShopModule,
    CatalogModule,
    InventoryModule,
    CartModule,
    OrderModule,
    PaymentModule,
    // …
  ],
})
export class AppModule {}
```

Each domain module registers its own controllers. No `UserApiModule` / `AdminApiModule` aggregator required — optional thin `AppFeaturesModule` is fine.

---

## 13. Dependency direction

```
Controller → Application (command/query) → Domain → Repository → DB
```

Across modules (one direction only):

```
OrderModule → CatalogQueryService
OrderModule → InventoryCommandService
OrderModule → UserQueryService
```

Never `OrderModule ↔ CartModule` circular imports. Extract shared types to a small `modules/order/contracts/` or `libs/types/` if needed.

---

## 14. Events

Use domain events for **side effects** (email, analytics), not for synchronous data fetching.

```
OrderPlaced → NotificationModule listener
```

Emit **after** transaction commits when possible. If emitting inside a transaction, listeners must not fail the main flow.

---

## 15. Internationalization

Unchanged: message keys in `src/i18n/en/message.json` and `src/i18n/bn/message.json`.  
Controllers/application services reference keys — no hardcoded user-facing strings.

---

## 16. Testing during refactor

- **Existing e2e tests must pass** after each domain migration.
- No new unit tests required for now.
- Run: `npx tsc --noEmit`, `pnpm lint`, `pnpm test:e2e` before marking a domain done.

---

## 17. Anti-patterns (do not introduce)

| Anti-pattern | Why it's wrong |
|--------------|----------------|
| Fat controller with DB/business logic | Breaks layer boundaries |
| Service calling `DrizzleService.client` | Bypasses repository; blocks extraction |
| Cross-module schema import | Breaks ownership |
| Cross-module repository injection | Couples persistence internals |
| Giant cross-module SQL join | Impossible after service split |
| Repository with business rules | Rules belong in domain/application |
| Separate module per audience (`AdminOrderModule`) | Duplicates domain rules |

---

## 18. Path to microservices (future)

If `CatalogModule` becomes a service:

1. Replace `CatalogQueryService` implementation with HTTP/gRPC client.
2. Callers (`ListAdminOrdersQuery`) stay unchanged.
3. Move `schema/catalog/` + catalog DB with the service.

Good boundaries today = cheap extraction tomorrow.

---

## 19. Operational commands

```bash
pnpm start:dev
pnpm build
npx tsc --noEmit --incremental false
pnpm lint
pnpm test
pnpm test:e2e
```

---

## 20. The one-sentence rule

**Every table has one owning module; only that module's repositories touch its schema; application services orchestrate through exported query/command APIs; controllers stay HTTP-thin; transactions stay ACID at the command layer.**
