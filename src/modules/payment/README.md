# Payment module

Platform payment methods catalog and order payment records (COD-first).

## Routes

| Controller | Path |
|------------|------|
| `AdminPaymentMethodsController` | `admin/payment-methods` |
| `PublicPaymentMethodsController` | `v1/payment-methods` |

## Public exports (`PaymentModule`)

| Export | Kind |
|--------|------|
| `ListPaymentMethodsQuery` | Admin list |
| `GetPaymentMethodQuery` | Admin get by id |
| `ListActivePaymentMethodsQuery` | Public active catalog |
| `PaymentQueryService` | Checkout: `resolveActivePaymentMethod` |
| `CreatePaymentMethodCommand` | Admin create |
| `UpdatePaymentMethodCommand` | Admin update |
| `ActivatePaymentMethodCommand` | Admin activate |
| `DeactivatePaymentMethodCommand` | Admin deactivate |

`PaymentMethodRepository` and `PaymentRepository` are module-private.

## Layout

```
controllers/     Admin + public payment methods HTTP
application/     Commands, queries, logo helper
domain/          Payment entity, status policy
mappers/         API response shapes
repositories/    payment-method + payment persistence
```

## Cross-module

Order checkout imports `PaymentQueryService` from `PaymentModule` (`PlaceOrderCommand`).
