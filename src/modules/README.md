# Domain modules (`src/modules/`)

Business domains live here as the modular monolith target layout. Each folder is a NestJS domain module (e.g. `order/`, `shop/`, `catalog/`) with `controllers/`, `application/`, `domain/`, `repositories/`, and `dto/`.

Legacy code remains under `src/api/`, `src/_repositories/`, and `src/common/` until migrated phase by phase. **Do not add new features under those legacy paths** — new domain code goes here.

Full architecture, layer rules, and the phased migration plan: [docs/architecture.md](../../docs/architecture.md) and [docs/refactor-phases.md](../../docs/refactor-phases.md).

**Imports:** use `@/modules/{domain}/...` (resolved via the existing `@/*` → `src/*` path alias in `tsconfig.json`).
