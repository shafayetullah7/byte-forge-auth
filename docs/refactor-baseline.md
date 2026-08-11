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

## Next

**Phase 1** — Shared transaction types + ESLint `no-restricted-imports` for schema ownership.
