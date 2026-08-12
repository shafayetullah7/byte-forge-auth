# Domain modules (`src/modules/`)

Business domains live here as the modular monolith target layout. Each folder is a NestJS domain module (e.g. `order/`, `shop/`, `catalog/`) with `controllers/`, `application/`, `domain/`, `repositories/`, and `dto/`.

Domain modules live here as the modular monolith target layout. **Do not add new features outside `src/modules/`** — shared infrastructure goes under `src/libs/`.

Full architecture, layer rules, and the phased migration plan: [docs/architecture.md](../../docs/architecture.md) and [docs/refactor-phases.md](../../docs/refactor-phases.md).

**Imports:** use `@/modules/{domain}/...` for domain code and `@/libs/...` for shared infrastructure (resolved via `@/*` → `src/*` in `tsconfig.json`).

## Auth guards (NestJS wiring)

All guard modules under `src/libs/guards/**` are **`@Global()`** and registered **once** in `AppModule` only.

| Do | Don't |
|----|--------|
| Use `@UseGuards(AdminAuthGuard)` (etc.) on controllers | Import `*GuardModule` in feature modules (`ShopModule`, `MediaModule`, …) |
| Import domain modules you need (`ShopModule`, `MediaModule`) | Re-import guard modules to “make guards work” |

Re-importing a guard module that depends on `AuthModule` inside a deep import graph (`UserModule` → `OrderModule` → `ShopModule` → …) causes `UndefinedModuleException` (module at index N is `undefined`) because `AuthModule` is still resolving when Nest hits the cycle.

Use `forwardRef()` only for **real** bidirectional domain dependencies (e.g. `UserModule` ↔ `OrderModule`), not for guards.
