# Byte Forge Auth - Project Constants

## Stack and Runtime
- Framework: NestJS (TypeScript)
- ORM/DB: Drizzle ORM + PostgreSQL
- Validation: `nestjs-zod` + `zod`
- Localization: `nestjs-i18n` with `en` / `bn`
- Package manager: `pnpm`
- Minimum runtime: Node `>=22`

## Codebase Map
- Domain modules under `src/modules/` — each registers its own controllers in `AppModule`
  - `admin/`
  - `user/` (buyer/seller/user-auth)
  - `public/`
- `src/libs/` - shared guards, modules, utils, email, events
- `src/_repositories/` - data access and query composition
- `src/_db/drizzle/` - schema, enums, drizzle service, seeds
- `src/i18n/` - API-facing localized message catalogs

## Architecture Rules
- Keep controllers thin: parse DTO, call service, wrap response.
- Keep business logic in service classes.
- Keep SQL/data access in repository layer only.
- Reuse existing shared services (`common/services`) before adding new custom logic.

## API and DTO Rules
- Use DTOs for all non-trivial endpoints.
- Prefer zod schema + `createZodDto` patterns already used in modules.
- Keep endpoint naming consistent with existing actor/feature modules.
- Maintain compatibility of existing response shapes unless task explicitly allows breaking change.

## Response and Error Rules
- Use response wrapper module/service for success and pagination responses.
- Use i18n keys for user-facing messages.
- Throw explicit Nest exceptions (`BadRequestException`, `NotFoundException`, etc.).
- Use `409` for stale update / optimistic concurrency conflicts where applicable.

## Auth and Access Rules
- User endpoints: user auth guards.
- Seller endpoints: user auth + seller/shop ownership validation.
- Admin endpoints: admin auth path and modules only.
- Do not assume buyer/seller/admin auth contexts are interchangeable.

## Order Lifecycle and Mutation Integrity
- Status transitions must go through centralized transition logic.
- Status-changing mutations should write status history.
- Multi-step order mutations should run in a DB transaction.
- When logic depends on current row state, lock row via existing repository patterns.

## Drizzle and Migration Policy
- Schema model changes belong in `src/_db/drizzle/schema/**`.
- Keep enums centralized and reused from drizzle enum files.
- Do not hand-edit generated migration journal/snapshots.
- Migration generation/execution is user-owned workflow; schema changes are code-owned.

## i18n Rules
- Add/update keys in both:
  - `src/i18n/en/message.json`
  - `src/i18n/bn/message.json`
- Avoid hardcoded English response strings in controllers/services.

## Definition of Done (Backend)
- Typecheck passes (`npx tsc --noEmit --incremental false`)
- Lint passes for touched files
- Relevant module tests pass (or clear reason provided)
- i18n keys updated in both locales if user-facing text changed
- No unintended API contract break

## Never Do
- Put domain/business logic inside controllers
- Query DB directly from controllers
- Skip history/audit writes for lifecycle transitions
- Introduce untranslated response strings
- Commit secrets or env credentials
