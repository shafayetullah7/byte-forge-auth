# Modular monolith refactor — complete

**Signed off:** 2026-08-12 (Phases 0–56)

The structural migration from legacy `src/api/`, `src/_repositories/`, and `src/common/` to `src/modules/` + `src/libs/` is **complete**. HTTP routes were preserved throughout; behavior changes were out of scope unless fixing regressions.

## Domain modules (14)

All features live under `src/modules/`:

| Module | Owns |
|--------|------|
| `auth` | User/admin auth, sessions, password reset |
| `user` | Profile, addresses, admin users |
| `shop` | Shop, verification, storefront, follow |
| `catalog` | Products, plants, taxonomy |
| `inventory` | Stock, movements, seller inventory API |
| `cart` | Cart, wishlist |
| `order` | Checkout, orders, seller/admin order ops |
| `payment` | Payment methods |
| `review` | Reviews, reports |
| `content` | Shop articles, campaigns |
| `media` | Uploads |
| `location` | Divisions, districts |
| `notification` | Transactional email listeners |
| `platform` | Health, admin languages, seller analytics |

`AppModule` imports domain modules directly (no `UserApiModule` / `AdminApiModule` aggregators).

## Infrastructure

- `src/libs/` — guards, email, events, middleware, utils (formerly `src/common/`)
- `src/_db/drizzle/` — schema source + migrations (unchanged)
- Guards: `@Global()`, registered once in `AppModule` only (see `src/modules/README.md`)

## ESLint enforcement

| Rule | Level | Status |
|------|-------|--------|
| `@/api/*`, `@/_repositories/*`, `@/common/*` | **error** | Zero violations |
| `@/_db/drizzle/schema` outside repositories | warn | ~87 violations — post-refactor debt |

Promote schema rule to **error** only after application-layer schema imports are moved behind repositories (follow-up cleanup, not blocking deploy).

## Deferred debt (non-blocking)

1. **Schema in application layer** — commands/queries/mappers still import `@/_db/drizzle/schema` in places; target is repository-only.
2. **Cross-module repository imports** — e.g. `catalog` → `MediaRepository` / `InventoryRepository` directly; target is exported command/query facades only.
3. **Auth repository exports** — `UserSessionRepository`, etc. exported for `@Global()` guards (documented exception).
4. **Dual user auth** — session cookies + JWT v2 coexist; see `modules/auth/README.md`.

## Manual smoke checklist (run locally with DB)

- [ ] `npm run build` / `tsc`
- [ ] `npm run lint` (0 errors; schema warnings OK)
- [ ] `npm run test:e2e` (or `docker:test`)
- [ ] Health: `GET /health`
- [ ] User register → login → profile
- [ ] Seller shop apply → verification submit
- [ ] Admin approve shop
- [ ] Browse public shop / plant PDP
- [ ] Cart → checkout (COD) → order placed email
- [ ] Seller accept → ship → buyer confirm delivery
- [ ] Buyer or seller cancel order
- [ ] Seller inventory restock / adjust

## References

- [architecture.md](./architecture.md)
- [refactor-phases.md](./refactor-phases.md)
- [refactor-baseline.md](./refactor-baseline.md)
- [refactor-playbook.md](./refactor-playbook.md)
