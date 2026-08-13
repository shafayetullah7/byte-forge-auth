# Subscription module

Seller platform billing — subscription plans, coupons, Stripe recurring, entitlement checks.

**Not in this module:** buyer checkout payments (`modules/payment/`), product pricing (`modules/catalog/`).

## Status

Skeleton only (Phase 2). Routes and providers are added in later phases per [SUBSCRIPTION_EXECUTION_PLAN.md](../../../docs/SUBSCRIPTION_EXECUTION_PLAN.md).

## Planned layout

```
subscription/
  controllers/       seller + admin HTTP + Stripe webhook
  application/
    commands/        mutations (redeem coupon, checkout, sync plan, …)
    queries/         read models + CheckSellerSubscriptionQuery
  domain/            policy, entities, errors (no DB)
  repositories/      subscription_* tables
  mappers/           API response shapes
  infrastructure/
    providers/       Stripe, coupon, wallet (v2) adapters
```

## Routes (v1)

| Audience | Method | Path |
|----------|--------|------|
| Admin | GET/POST/PATCH | `v1/admin/subscription/plans` |
| Admin | POST | `v1/admin/subscription/plans/:id/sync-stripe` |
| Admin | PATCH | `v1/admin/subscription/plans/:id/retire` |
| Admin | GET/POST/PATCH | `v1/admin/subscription/coupons` |
| Admin | PATCH | `v1/admin/subscription/coupons/:id/deactivate` |

## Stripe plan sync

- Requires `STRIPE_SECRET_KEY` in the environment.
- First sync creates a Stripe Product + recurring Price (BDT) and stores IDs on the plan row.
- Re-sync is idempotent when price/interval unchanged.
- If `priceBdt` or `interval` changed, a **new** Stripe Price is created, the old Price ID is appended to `previousStripePriceIds`, and the old Price is deactivated in Stripe (grandfathering existing subscribers).

| Audience | Method | Path |
|----------|--------|------|
| Seller | (Phase 10+) | `v1/user/seller/subscription` |
| Webhook | (Phase 14+) | `v1/webhooks/stripe/subscription` |

## Cross-module export

Other modules import **`CheckSellerSubscriptionQuery`** only (exported from `SubscriptionModule`).

When `SUBSCRIPTION_ENFORCEMENT_ENABLED=false`, `active` is always `true` so existing flows are unchanged until Phase 32.

## Feature flag

`SUBSCRIPTION_ENFORCEMENT_ENABLED=false` by default until Phase 32 QA.
