# Payment module

Platform payment methods catalog and order payment records (COD-first).

## Phase 16 scope

- `PaymentMethodRepository` — moved from `_repositories/payment/`
- `PaymentRepository` — `payments` table access (module-private)
- `Payment` entity — COD-oriented status transitions

## Public exports (`PaymentModule`)

| Export | Notes |
|--------|--------|
| `PaymentMethodRepository` | Temporary for legacy admin/public API until Phases 17–18 |

`PaymentRepository` and `Payment` entity are internal until order/payment command cutover.

## Layout

```
domain/          Payment entity, status policy
repositories/    payment-method + payment persistence
```

## Routes (legacy, unchanged)

| Area | Path |
|------|------|
| Admin | `admin/payment-methods` |
| Public | `payment-methods` |

HTTP migrates to `modules/payment/controllers/` in Phases 17–18.
