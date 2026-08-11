# Backend Playbook

> Architecture: see [architecture.md](./architecture.md) (modular monolith under `src/modules/{domain}/`).

## Add a New Endpoint
1. Identify owning domain module under `src/modules/{domain}/` and actor (admin/buyer/seller/public).
2. Add DTO schema/class in feature `dto/`.
3. Add/extend service method for business logic.
4. Add/extend repository methods if persistence changes are needed.
5. Add controller route with proper guards/decorators.
6. Return response via shared response wrapper service.
7. Add i18n message keys in both locales.
8. Validate with typecheck/lint/tests.

## Add a New Seller/Buyer/Admin Guarded Route
1. Place route in correct actor module.
2. Apply existing auth guard stack for that actor.
3. Enforce ownership constraints in service/repository query.
4. Ensure cross-actor leakage cannot occur.

## Add/Change Drizzle Model
1. Update schema under `src/_db/drizzle/schema/**`.
2. Update related enums/types if needed.
3. Update repository mappings/selects/writes.
4. Update DTOs/services/controllers consuming changed fields.
5. Hand off migration execution to user-owned workflow.

## Add a New Order Status Mutation
1. Update transition rules in centralized transition service.
2. Update seller/buyer action availability logic (if exposed).
3. Apply transaction + row lock where needed.
4. Persist status history record.
5. Ensure mapper/response includes required status fields.
6. Validate stale update handling (`409`) where applicable.

## Add i18n Message
1. Add key in `src/i18n/en/message.json`.
2. Add corresponding key in `src/i18n/bn/message.json`.
3. Reference key from controller/service response call.
4. Avoid inline user-facing English strings.

## Pre-PR Validation Checklist
- `npx tsc --noEmit --incremental false`
- `pnpm lint`
- Targeted tests for touched feature
- API contract sanity check for changed routes
- No secrets or environment-sensitive files staged
